'use client';

import { useEffect, useState } from 'react';
import { promocodeService, PromoCode } from '@/services/promocode.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { toast } from 'sonner';
import { SearchFilters, FilterConfig } from '@/components/ui/SearchFilters';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Pagination } from '@/components/ui/Pagination';

export default function PromocodesPage() {
    const [promocodes, setPromocodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 10;
    const searchParams = useSearchParams();

    const editId = searchParams.get('edit');

    // Form states
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percent',
        discount_value: '',
        starts_at: '',
        ends_at: '',
        max_uses_total: '',
        max_uses_per_user: '',
        min_order_amount: '',
        max_discount: '',
        is_active: true,
    });

    const fetchPromocodes = async () => {
        try {
            setLoading(true);
            const res = await promocodeService.getAll(page, limit, activeFilters);

            // Try different response structures
            let promocodesData: PromoCode[] = [];

            if (Array.isArray(res)) {
                promocodesData = res;
            } else if (res.promo_codes) {
                promocodesData = res.promo_codes;
            } else if ((res as any).data) {
                promocodesData = (res as any).data;
            } else if ((res as any).items) {
                promocodesData = (res as any).items;
            } else if ((res as any).results) {
                promocodesData = (res as any).results;
            } else if ((res as any).promocodes) {
                promocodesData = (res as any).promocodes;
            } else {
                // Unknown response structure
            }

            setPromocodes(promocodesData);
            setPromocodes(promocodesData);
            const total = res.count ||
                (res as any).total_items ||
                (res as any).meta?.total_items ||
                (res as any).total ||
                promocodesData.length;
            setTotalItems(total);
        } catch (error) {
            toast.error('Failed to fetch promocodes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromocodes();
    }, [activeFilters, page]);


    const formatToDateTimeLocal = (dateStr: string | null) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    useEffect(() => {
        if (editId && promocodes.length > 0) {
            const promo = promocodes.find(p => p.id === editId);
            if (promo) {
                handleOpenModal(promo);
            }
        }
    }, [editId, promocodes]);

    const handleOpenModal = (promo?: PromoCode) => {
        if (promo) {
            setEditingPromo(promo);
            setFormData({
                code: promo.code || '',
                discount_type: promo.discount_type || 'percent',
                discount_value: promo.discount_value?.toString() || '',
                starts_at: formatToDateTimeLocal(promo.starts_at),
                ends_at: formatToDateTimeLocal(promo.ends_at),
                max_uses_total: promo.max_uses_total?.toString() || '',
                max_uses_per_user: promo.max_uses_per_user?.toString() || '',
                min_order_amount: promo.min_order_amount?.toString() || '',
                max_discount: promo.max_discount?.toString() || '',
                is_active: promo.is_active ?? true,
            });
        } else {
            setEditingPromo(null);
            setFormData({
                code: '',
                discount_type: 'percent',
                discount_value: '',
                starts_at: '',
                ends_at: '',
                max_uses_total: '',
                max_uses_per_user: '',
                min_order_amount: '',
                max_discount: '',
                is_active: true,
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPromo(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const payload: any = {
                code: formData.code,
                discount_type: formData.discount_type,
                discount_value: Number(formData.discount_value) || 0,
                is_active: formData.is_active,
                starts_at: formData.starts_at.split('T')[0], // YYYY-MM-DD format
                ends_at: formData.ends_at.split('T')[0], // YYYY-MM-DD format
                max_uses_total: Number(formData.max_uses_total) || 0,
                max_uses_per_user: Number(formData.max_uses_per_user) || 0,
                min_order_amount: Number(formData.min_order_amount) || 0,
                max_discount: Number(formData.max_discount) || 0,
            };

            if (editingPromo) {
                // Update
                const { code, ...updatePayload } = payload;
                await promocodeService.update(editingPromo.id, updatePayload as any);
                toast.success('Promokod muvaffaqiyatli yangilandi');
            } else {
                // Create
                await promocodeService.create(payload);
                toast.success('Promokod muvaffaqiyatli yaratildi');
            }
            handleCloseModal();
            fetchPromocodes();
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Promokodni saqlashda xatolik';
            toast.error(`Xatolik: ${message}`);
        }
    };

    const handleDelete = async (promo: PromoCode) => {
        if (!confirm('Ushbu promokodni o\'chirishni xohlaysizmi?')) return;
        try {
            await promocodeService.delete(promo.id);
            toast.success('Promokod muvaffaqiyatli o\'chirildi');
            fetchPromocodes();
        } catch (error) {
            toast.error('Promokodni o\'chirishda xatolik');
        }
    };

    const columns = [
        {
            key: 'code',
            header: 'Kod',
            render: (item: PromoCode) => (
                <Link href={`/admin/promocodes/${item.id}`} className="text-blue-600 hover:underline font-medium">
                    {item.code}
                </Link>
            )
        },
        {
            key: 'discount',
            header: 'Chegirma',
            render: (item: PromoCode) => (
                <span>{item.discount_value} {item.discount_type === 'percent' ? '%' : ' UZS'}</span>
            )
        },
        {
            key: 'usage',
            header: 'Ishlatilishi',
            render: (item: PromoCode) => (
                <span>{item.max_uses_total} jami / {item.max_uses_per_user} har bir foydalanuvchi</span>
            )
        },
        {
            key: 'validity',
            header: 'Amal qilish muddati',
            render: (item: PromoCode) => {
                const formatDate = (dateStr: string | null) => {
                    if (!dateStr) return '-';
                    // If it's already a full ISO string, handle it; if just YYYY-MM-DD, parse safely
                    const date = new Date(dateStr);
                    if (isNaN(date.getTime())) return '-';
                    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                };

                return (
                    <div className="text-sm text-gray-500">
                        {formatDate(item.starts_at)} - {formatDate(item.ends_at)}
                    </div>
                );
            }
        },
        {
            key: 'status',
            header: 'Holat',
            render: (item: PromoCode) => (
                <span
                    className={`px-2 py-1 rounded-full text-xs ${item.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}
                >
                    {item.is_active ? 'Faol' : 'Faol emas'}
                </span>
            )
        },
    ];

    const filterConfigs: FilterConfig[] = [
        { key: 'code', label: 'Kod', type: 'text', placeholder: 'Kod bo\'yicha qidirish...' },
        { key: 'is_active', label: 'Faol', type: 'boolean' },
    ];

    if (loading && promocodes.length === 0) return <div className="p-8">Yuklanmoqda...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Promokodlar</h1>
                <Button onClick={() => handleOpenModal()}>
                    <span className="mr-2">➕</span> Promokod yaratish
                </Button>
            </div>

            <SearchFilters configs={filterConfigs} onFilter={setActiveFilters} />

            <Table
                data={promocodes}
                columns={columns}
                onEdit={handleOpenModal}
                onDelete={handleDelete}
            />

            <Pagination
                currentPage={page}
                totalItems={totalItems || promocodes.length}
                perPage={limit}
                onPageChange={setPage}
            />


            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingPromo ? 'Promokodni tahrirlash' : 'Promokod yaratish'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Kod"
                            id="code"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            disabled={!!editingPromo}
                            required
                        />
                        <Select
                            label="Holat"
                            value={formData.is_active ? 'true' : 'false'}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                            options={[
                                { value: 'true', label: 'Faol' },
                                { value: 'false', label: 'Faol emas' },
                            ]}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Chegirma turi"
                            value={formData.discount_type}
                            onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                            options={[
                                { value: 'percent', label: 'Foiz' },
                                { value: 'fixed', label: 'Aniq summa' },
                            ]}
                        />
                        <Input
                            label="Chegirma qiymati"
                            id="value"
                            type="number"
                            value={formData.discount_value}
                            onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Boshlanish vaqti"
                            id="starts_at"
                            type="datetime-local"
                            value={formData.starts_at}
                            onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                            required
                        />
                        <Input
                            label="Tugash vaqti"
                            id="ends_at"
                            type="datetime-local"
                            value={formData.ends_at}
                            onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Maksimal ishlatish (Jami)"
                            id="max_uses"
                            type="number"
                            value={formData.max_uses_total}
                            onChange={(e) => setFormData({ ...formData, max_uses_total: e.target.value })}
                            required
                        />
                        <Input
                            label="Maksimal ishlatish (Har bir foydalanuvchi)"
                            id="max_per_user"
                            type="number"
                            value={formData.max_uses_per_user}
                            onChange={(e) => setFormData({ ...formData, max_uses_per_user: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Minimal buyurtma summasi"
                            id="min_order"
                            type="number"
                            value={formData.min_order_amount}
                            onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                            required
                        />
                        <Input
                            label="Maksimal chegirma summasi"
                            id="max_discount"
                            type="number"
                            value={formData.max_discount}
                            onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={handleCloseModal}>
                            Bekor qilish
                        </Button>
                        <Button type="submit">Saqlash</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
