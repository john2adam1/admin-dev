'use client';

import { useEffect, useState } from 'react';
import { promocodeService, PromoCode } from '@/services/promocode.service';
import { courseService } from '@/services/course.service';
import { Course } from '@/types';
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
        type: 'all',
        courses: [] as string[],
    });
    const [courses, setCourses] = useState<Course[]>([]);

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

            // Fetch full details for each promocode to get course lists correctly
            const fullPromocodes = await Promise.all(
                promocodesData.map(async (p) => {
                    try {
                        return await promocodeService.getOne(p.id);
                    } catch (e) {
                        return p;
                    }
                })
            );

            setPromocodes(fullPromocodes);
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

    const fetchCourses = async () => {
        try {
            const res = await courseService.getAllWithoutPagination();
            setCourses(res.data || []);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        }
    };

    useEffect(() => {
        fetchPromocodes();
        fetchCourses();
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

    const handleOpenModal = async (promo?: PromoCode) => {
        if (promo) {
            let fullPromo = promo;
            // Always fetch fresh data to ensure we have all fields for editing
            try {
                fullPromo = await promocodeService.getOne(promo.id);
            } catch (error) {
                console.error('Failed to fetch promo details:', error);
            }

            setEditingPromo(fullPromo);
            setFormData({
                code: fullPromo.code || '',
                discount_type: fullPromo.discount_type || 'percent',
                discount_value: fullPromo.discount_value?.toString() || '',
                starts_at: formatToDateTimeLocal(fullPromo.starts_at),
                ends_at: formatToDateTimeLocal(fullPromo.ends_at),
                max_uses_total: fullPromo.max_uses_total?.toString() || '',
                max_uses_per_user: fullPromo.max_uses_per_user?.toString() || '',
                min_order_amount: fullPromo.min_order_amount?.toString() || '',
                max_discount: fullPromo.max_discount?.toString() || '',
                is_active: fullPromo.is_active ?? true,
                type: fullPromo.type === 'course' ? 'selected' : (fullPromo.type || 'all'),
                courses: fullPromo.courses || [],
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
                type: 'all',
                courses: [],
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPromo(null);
    };

    const formatDateForApi = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Robust payload building
            const payload: any = {
                code: formData.code,
                discount_type: formData.discount_type,
                discount_value: Number(formData.discount_value) || 0,
                is_active: formData.is_active,
                starts_at: formatDateForApi(formData.starts_at),
                ends_at: formatDateForApi(formData.ends_at),
                type: formData.type === 'selected' ? 'course' : formData.type,
            };

            if (formData.type === 'selected' || formData.type === 'course' || payload.type === 'course') {
                payload.courses = formData.courses;
                payload.course_ids = formData.courses;
                payload.course_id = formData.courses[0] || ''; // Fallback for singular field
            } else {
                payload.courses = [];
                payload.course_ids = [];
                payload.course_id = '';
            }

            // Map usage limits with redundant names for compatibility
            if (formData.max_uses_total !== '') {
                const val = Number(formData.max_uses_total);
                payload.max_uses_total = val;
                payload.max_uses = val;
            }
            if (formData.max_uses_per_user !== '') {
                const val = Number(formData.max_uses_per_user);
                payload.max_uses_per_user = val;
                payload.max_per_user = val; // Some APIs use this
            }
            if (formData.min_order_amount !== '') {
                const val = Number(formData.min_order_amount);
                payload.min_order_amount = val;
                payload.min_order = val; // Some APIs use this
            }
            if (formData.max_discount !== '') {
                const val = Number(formData.max_discount);
                payload.max_discount = val;
            }

            console.log('Sending Promocode Payload:', payload);

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
            console.error('Promocode Error Details:', error.response?.data);
            const backendMessage = typeof error.response?.data === 'string'
                ? error.response.data
                : JSON.stringify(error.response?.data);
            const message = error.response?.data?.message || backendMessage || error.message || 'Promokodni saqlashda xatolik';
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
            key: 'type',
            header: 'Turi',
            render: (item: PromoCode) => {
                // Log item to see actual structure from backend
                if (item.code === '1222saaaa' || item.type === 'course' || item.type === 'selected') {
                    console.log(`Promocode [${item.code}] data:`, item);
                }
                const courseCount = item.courses?.length || (item.course_id ? 1 : 0);
                return (
                    <span className="capitalize">
                        {item.type === 'all' ? 'Barcha kurslar' : `Tanlangan (${courseCount})`}
                    </span>
                );
            }
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
                                { value: 'percent', label: 'Foiz (%)' },
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

                    <div className="space-y-2">
                        <Select
                            label="Promokod turi"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            options={[
                                { value: 'all', label: 'Barcha kurslar uchun' },
                                { value: 'selected', label: 'Tanlangan kurslar uchun' },
                            ]}
                        />
                    </div>

                    {formData.type === 'selected' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Kurslarni tanlang</label>
                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                                {courses.map((course) => (
                                    <label key={course.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={formData.courses.includes(course.id)}
                                            onChange={(e) => {
                                                const newCourses = e.target.checked
                                                    ? [...formData.courses, course.id]
                                                    : formData.courses.filter(id => id !== course.id);
                                                setFormData({ ...formData, courses: newCourses });
                                            }}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                        />
                                        <span className="text-sm">
                                            {course.name?.uz || course.name?.ru || 'Nomsiz kurs'}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

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
