'use client';

import { useEffect, useState } from 'react';
import { orderService, Order } from '@/services/order.service';
import { userService } from '@/services/user.service';
import { courseService } from '@/services/course.service';
import { promocodeService } from '@/services/promocode.service';
import { useRouter } from 'next/navigation';
import { Table } from '@/components/ui/Table';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { SearchFilters, FilterConfig } from '@/components/ui/SearchFilters';
import { Pagination } from '@/components/ui/Pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_COLORS: Record<string, string> = {
    'PAID': 'bg-green-100 text-green-800',
    'NEW': 'bg-blue-100 text-blue-800',
    'CANCELLED': 'bg-red-100 text-red-800',
    'RESERVED': 'bg-purple-100 text-purple-800',
    'EXPIRED': 'bg-gray-100 text-gray-800'
};

const STATUS_TEXT: Record<string, string> = {
    'PAID': 'To\'langan',
    'NEW': 'Yangi',
    'CANCELLED': 'Bekor qilingan',
    'RESERVED': 'Band qilingan',
    'EXPIRED': 'Muddati o\'tgan'
};


type DateRangeType = 'day' | 'week' | 'month' | 'year' | 'all' | 'custom';

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 10;
    const router = useRouter();

    // New State for Tabs and Date Filters
    const [activeTab, setActiveTab] = useState('paid');
    const [dateRangeType, setDateRangeType] = useState<DateRangeType>('day'); // Defaulting to 'day' as per user request logic? Or stick to 'month'? User just said "if 'day' is selected...". Staying with 'month' default is safer unless requested otherwise. But I'll stick to maintaining existing default unless user asked to default to day view. Ah, user said "by default, it should show today". This implies when 'day' is selected, the date picker shows today.
    const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]);
    const [customDate, setCustomDate] = useState({ from: '', to: '' });
    const [otherStatus, setOtherStatus] = useState('CANCELLED');

    // Filter Options State
    const [usersOptions, setUsersOptions] = useState<{ value: string; label: string }[]>([]);
    const [coursesOptions, setCoursesOptions] = useState<{ value: string; label: string }[]>([]);
    const [promocodesOptions, setPromocodesOptions] = useState<{ value: string; label: string }[]>([]);

    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                // Fetch first 100 items for dropdowns
                const [usersRes, coursesRes, promocodesRes] = await Promise.all([
                    userService.getAll(1, 100),
                    courseService.getAllWithoutPagination(),
                    promocodeService.getAll(1, 100)
                ]);

                // Fix: Check if 'items', 'data', or specific keys exist
                const users = (usersRes as any).items || (usersRes as any).data || (Array.isArray(usersRes) ? usersRes : []);
                const courses = (coursesRes as any).items || (coursesRes as any).data || (Array.isArray(coursesRes) ? coursesRes : []);

                let promocodes: any[] = [];
                if (Array.isArray(promocodesRes)) {
                    promocodes = promocodesRes;
                } else if ((promocodesRes as any).promo_codes) {
                    promocodes = (promocodesRes as any).promo_codes;
                } else if ((promocodesRes as any).promocodes) {
                    promocodes = (promocodesRes as any).promocodes;
                } else if ((promocodesRes as any).data) {
                    promocodes = (promocodesRes as any).data;
                } else if ((promocodesRes as any).items) {
                    promocodes = (promocodesRes as any).items;
                }

                setUsersOptions(users.map((u: any) => ({
                    value: u.id,
                    label: `${u.first_name || u.name || ''} ${u.last_name || ''} (${u.phone_number || ''})`.trim() || 'Nomsiz Foydalanuvchi'
                })));

                setCoursesOptions(courses.map((c: any) => {
                    const name = c.name || c.title || 'Unknown Course';
                    const label = typeof name === 'object'
                        ? (name.uz || name.ru || name.en || 'Unknown Course')
                        : String(name);
                    return { value: c.id, label };
                }));

                setPromocodesOptions(promocodes.map(p => ({ value: p.code, label: p.code })));

            } catch (error) {
                console.error("Failed to fetch filter options", error);
            }
        };

        fetchFilterOptions();
    }, []);

    const getDateRange = (type: DateRangeType) => {
        const now = new Date();
        let to = now.toISOString().split('T')[0];
        let from = '';

        switch (type) {
            case 'day':
                from = selectedDay;
                to = selectedDay;
                break;
            case 'week': {
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                const monday = new Date(now.setDate(diff));
                from = monday.toISOString().split('T')[0];
                break;
            }
            case 'month': {
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                const offset = firstDay.getTimezoneOffset();
                const firstDayLocal = new Date(firstDay.getTime() - (offset * 60 * 1000));
                from = firstDayLocal.toISOString().split('T')[0];
                break;
            }
            case 'year': {
                const firstDay = new Date(now.getFullYear(), 0, 1);
                const offset = firstDay.getTimezoneOffset();
                const firstDayLocal = new Date(firstDay.getTime() - (offset * 60 * 1000));
                from = firstDayLocal.toISOString().split('T')[0];
                break;
            }
            case 'all':
                from = '2000-01-01';
                break;
            case 'custom':
                return customDate;
        }
        return { from, to };
    };

    const fetchOrders = async () => {
        try {
            setLoading(true);

            const { from, to } = getDateRange(dateRangeType);

            // Determine status based on active tab
            let status = '';
            if (activeTab === 'paid') status = 'PAID';
            else if (activeTab === 'new') status = 'NEW';
            else if (activeTab === 'other') status = otherStatus;

            const finalFilters = {
                ...activeFilters,
                status,
                from: activeTab === 'all' ? undefined : from, // If 'all' tab exist but we don't have one
                to: activeTab === 'all' ? undefined : to,
                type: 'range', // Enforce range type for date filtering
                payment_type: activeFilters.promocode ? 'click' : activeFilters.payment_type
            };

            // If range type is 'all', we might want to extend the range or remove type='range' depending on backend
            if (dateRangeType === 'all') {
                finalFilters.from = '2000-01-01';
                finalFilters.to = '2099-12-31';
            }

            // Should apply date filters?
            if (dateRangeType === 'custom' && (!customDate.from || !customDate.to)) {
                // Wait for custom date completion
                // But functionality requires us to fetch valid data. 
                // If invalid, fallback to month? Or just don't fetch?
                // Let's fallback to today if empty
                if (!customDate.from) finalFilters.from = new Date().toISOString().split('T')[0];
                if (!customDate.to) finalFilters.to = new Date().toISOString().split('T')[0];
            }

            const res = await orderService.getAll(page, limit, finalFilters);
            const data: any = res;
            let ordersData: Order[] = [];

            if (Array.isArray(data)) {
                ordersData = data;
            } else if (data.orders) {
                ordersData = data.orders;
            } else if (data.data) {
                ordersData = data.data;
            } else if (data.items) {
                ordersData = data.items;
            } else {
                // Unknown order response structure
            }

            setOrders(ordersData);
            setOrders(ordersData);
            const total = res.count ||
                (res as any).total_items ||
                (res as any).meta?.total_items ||
                (res as any).total ||
                ordersData.length;
            setTotalItems(total);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            // toast.error('Failed to fetch orders'); // Suppress toast on initial load or frequent updates
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [activeFilters, page, activeTab, dateRangeType, otherStatus, customDate.from, customDate.to, selectedDay]);


    const columns = [
        {
            key: 'user',
            header: 'Foydalanuvchi',
            render: (order: Order) => (
                <div>
                    <div className="font-medium">{order.user_name}</div>
                    <div className="text-sm text-gray-500">{order.user_phone}</div>
                </div>
            )
        },
        { key: 'course_name', header: 'Kurs' },
        {
            key: 'amount',
            header: 'Summa',
            render: (order: Order) => (
                <span>{new Intl.NumberFormat('uz-UZ').format(order.amount)} UZS</span>
            )
        },
        {
            key: 'status',
            header: 'Holati',
            render: (order: Order) => {
                const statusKey = order.status.toUpperCase();
                const colorClass = STATUS_COLORS[statusKey] || 'bg-gray-100 text-gray-800';
                const statusText = STATUS_TEXT[statusKey] || order.status;
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                        {statusText}
                    </span>
                );
            }
        },
        {
            key: 'payment_type',
            header: 'Usul',
            render: (order: Order) => (
                <span className="capitalize font-medium text-gray-700">
                    {order.payment_type === 'admin' ? 'Admin' : 'Click'}
                </span>
            )
        },
        {
            key: 'created_at',
            header: 'Sana',
            render: (order: Order) => (
                <span>{order.created_at ? new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</span>
            )
        },
        {
            key: 'actions',
            header: 'Amallar',
            render: (order: Order) => (
                <Button size="sm" variant="outline" onClick={() => router.push(`/admin/orders/${order.id}`)}>
                    Ko'rish
                </Button>
            )
        }
    ];

    const filterConfigs: FilterConfig[] = [
        {
            key: 'user_id',
            label: 'Foydalanuvchi',
            type: 'select',
            placeholder: 'Foydalanuvchini tanlang',
            options: usersOptions
        },
        {
            key: 'course_id',
            label: 'Kurs',
            type: 'select',
            placeholder: 'Kursni tanlang',
            options: coursesOptions
        },
        {
            key: 'promocode',
            label: 'Promokod',
            type: 'select',
            placeholder: 'Promokodni tanlang',
            options: promocodesOptions
        },
        {
            key: 'payment_type',
            label: 'To\'lov turi',
            type: 'select',
            options: [
                { value: 'click', label: 'Click' },
                { value: 'admin', label: 'Admin' },
            ],
        },
    ];

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Buyurtmalar</h1>

            {/* Status Tabs */}
            <div className="mb-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 max-w-md">
                        <TabsTrigger value="paid">To'langan</TabsTrigger>
                        <TabsTrigger value="new">Yangi (Click)</TabsTrigger>
                        <TabsTrigger value="other">Boshqa</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Secondary Status Filter for 'Other' Tab */}
            {activeTab === 'other' && (
                <div className="mb-4 flex gap-2 items-center bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Holati:</span>
                    <select
                        value={otherStatus}
                        onChange={(e) => setOtherStatus(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white"
                    >
                        <option value="CANCELLED">Bekor qilingan</option>
                        <option value="RESERVED">Band qilingan</option>
                        <option value="EXPIRED">Muddati o'tgan</option>
                    </select>
                </div>
            )}

            {/* Date Range Filters */}
            <div className="mb-6 flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium text-gray-700 mr-2">Sana oralig'i:</span>
                <Button
                    variant={dateRangeType === 'day' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDateRangeType('day')}
                >
                    Kun
                </Button>
                <Button
                    variant={dateRangeType === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDateRangeType('week')}
                >
                    Hafta
                </Button>
                <Button
                    variant={dateRangeType === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDateRangeType('month')}
                >
                    Oy
                </Button>
                <Button
                    variant={dateRangeType === 'year' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDateRangeType('year')}
                >
                    Yil
                </Button>
                <Button
                    variant={dateRangeType === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDateRangeType('all')}
                >
                    Barcha vaqt
                </Button>
                <Button
                    variant={dateRangeType === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDateRangeType('custom')}
                >
                    Boshqa
                </Button>

                {dateRangeType === 'custom' && (
                    <div className="flex gap-2 items-center ml-2">
                        <input
                            type="date"
                            value={customDate.from}
                            onChange={(e) => setCustomDate(prev => ({ ...prev, from: e.target.value }))}
                            className="px-2 py-1 border rounded text-sm"
                        />
                        <span>-</span>
                        <input
                            type="date"
                            value={customDate.to}
                            onChange={(e) => setCustomDate(prev => ({ ...prev, to: e.target.value }))}
                            className="px-2 py-1 border rounded text-sm"
                        />
                    </div>
                )}

                {dateRangeType === 'day' && (
                    <div className="flex gap-2 items-center ml-2">
                        <input
                            type="date"
                            value={selectedDay}
                            onChange={(e) => setSelectedDay(e.target.value)}
                            className="px-2 py-1 border rounded text-sm"
                        />
                    </div>
                )}
            </div>

            <SearchFilters
                onFilter={setActiveFilters}
                configs={filterConfigs}
            />

            {loading ? (
                <div className="text-center py-10">Buyurtmalar yuklanmoqda...</div>
            ) : (
                <Table
                    data={orders}
                    columns={columns}
                />
            )}

            <Pagination
                currentPage={page}
                totalItems={totalItems || orders.length}
                perPage={limit}
                onPageChange={setPage}
            />

        </div>
    );
}
