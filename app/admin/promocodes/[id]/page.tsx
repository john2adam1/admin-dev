'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { promocodeService, PromoCode } from '@/services/promocode.service';
import { PromocodeRedemption } from '@/types';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/separator';
import { SearchFilters, FilterConfig } from '@/components/ui/SearchFilters';
import { toast } from 'sonner';
import { Pagination } from '@/components/ui/Pagination';

export default function PromocodeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [promocode, setPromocode] = useState<PromoCode | null>(null);
    const [redemptions, setRedemptions] = useState<PromocodeRedemption[]>([]);
    const [loading, setLoading] = useState(true);
    const [redemptionsLoading, setRedemptionsLoading] = useState(true);
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 10;


    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchRedemptions();
        }
    }, [id, activeFilters, page]);


    const loadData = async () => {
        try {
            setLoading(true);
            const data = await promocodeService.getOne(id);
            if (!data) {
                router.push('/admin/promocodes');
                return;
            }
            setPromocode(data);
        } catch (error) {
            console.error('Failed to load promocode:', error);
            toast.error('Promokodni yuklashda xatolik');
        } finally {
            setLoading(false);
        }
    };

    const fetchRedemptions = async () => {
        try {
            setRedemptionsLoading(true);
            const res = await promocodeService.getRedemptions(id, page, limit, activeFilters);
            console.log('API Response for Redemptions:', res);
            setRedemptions(res.data || []);
            setTotalItems(res.total || (res as any).meta?.total_items || (res.data || []).length);
        } catch (error) {
            console.error('Failed to load redemptions:', error);
            // Don't toast here to avoid cluttering if it's just a 404/empty
        } finally {
            setRedemptionsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Yuklanmoqda...</p>
            </div>
        );
    }

    if (!promocode) {
        return null;
    }

    const breadcrumbItems = [
        { label: 'Promokodlar', href: '/admin/promocodes' },
        { label: promocode.code },
    ];

    const columns = [
        { key: 'user_name', header: 'Foydalanuvchi' },
        { key: 'user_phone', header: 'Aloqa' },
        {
            key: 'course_name',
            header: 'Kurs',
            render: (item: PromocodeRedemption) => item.course_name || 'N/A'
        },
        {
            key: 'used_at',
            header: 'Ishlatilgan vaqti',
            render: (item: PromocodeRedemption) => {
                const dateStr = item.used_at || item.created_at;
                const date = new Date(dateStr);
                return isNaN(date.getTime()) ? '-' : date.toLocaleString();
            }
        },
        {
            key: 'discount_amount',
            header: 'Tejaldi',
            render: (item: PromocodeRedemption) => `${item.discount_amount.toLocaleString()} UZS`
        },
        {
            key: 'status',
            header: 'Holat',
            render: (item: PromocodeRedemption) => (
                <Badge variant={item.status === 'paid' ? 'success' : 'secondary'}>
                    {item.status || 'N/A'}
                </Badge>
            )
        }
    ];

    const filterConfigs: FilterConfig[] = [
        { key: 'user_name', label: 'Foydalanuvchi ismi', type: 'text', placeholder: 'Foydalanuvchi bo\'yicha qidirish...' },
        { key: 'course_name', label: 'Kurs nomi', type: 'text', placeholder: 'Kurs bo\'yicha qidirish...' },
    ];

    return (
        <div className="space-y-6">
            <Breadcrumb items={breadcrumbItems} />

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Promokod: {promocode.code}</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <Badge variant={promocode.is_active ? 'success' : 'secondary'}>
                            {promocode.is_active ? 'Faol' : 'Faol emas'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                            {promocode.discount_value} {promocode.discount_type === 'percent' ? '%' : 'UZS'} chegirma
                        </span>
                    </div>
                </div>
                <Button onClick={() => router.push(`/admin/promocodes?edit=${id}`)}>
                    Promokodni tahrirlash
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Jami ishlatilishi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalItems} / {promocode.max_uses_total || '∞'}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Maksimal {promocode.max_uses_per_user} har bir foydalanuvchi
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Amal qilish muddati</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm">
                            <span className="font-semibold">Boshlanish:</span> {promocode.starts_at ? new Date(promocode.starts_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </div>
                        <div className="text-sm">
                            <span className="font-semibold">Tugash:</span> {promocode.ends_at ? new Date(promocode.ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Buyurtma limitlari</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm">
                            <span className="font-semibold">Minimal buyurtma:</span> {promocode.min_order_amount.toLocaleString()} UZS
                        </div>
                        <div className="text-sm">
                            <span className="font-semibold">Maksimal chegirma:</span> {promocode.max_discount.toLocaleString()} UZS
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Separator />

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Ishlatilishlar</CardTitle>
                            <CardDescription>
                                Ushbu promokodni ishlatgan foydalanuvchilar
                            </CardDescription>
                        </div>
                    </div>
                    <div className="mt-4">
                        <SearchFilters configs={filterConfigs} onFilter={setActiveFilters} />
                    </div>
                </CardHeader>
                <CardContent>
                    {redemptionsLoading && redemptions.length === 0 ? (
                        <div className="flex justify-center py-8 text-muted-foreground">Ishlatilishlar yuklanmoqda...</div>
                    ) : redemptions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">Ishlatilishlar topilmadi.</div>
                    ) : (
                        <div className="space-y-4">
                            <Table data={redemptions} columns={columns} />
                            <Pagination
                                currentPage={page}
                                totalItems={totalItems || redemptions.length}
                                perPage={limit}
                                onPageChange={setPage}
                            />
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
