'use client';

import { useState, useEffect } from 'react';
import { About } from '@/types';
import { aboutService } from '@/services/about.service';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { MultilangInput } from '@/components/ui/MultilangInput';
import { SearchFilters, FilterConfig } from '@/components/ui/SearchFilters';
import { Pagination } from '@/components/ui/Pagination';

export default function AboutPage() {
    const [items, setItems] = useState<About[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<About | null>(null);
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 1000;

    const [formData, setFormData] = useState({
        title: { uz: '', ru: '', en: '' },
        description: { uz: '', ru: '', en: '' },
        order_num: 1,
        link_url: '',
    });

    useEffect(() => {
        loadData();
    }, [activeFilters, page]);


    const loadData = async () => {
        try {
            setLoading(true);
            const response = await aboutService.getAll(page, limit, activeFilters);
            setItems(response.data);
            setTotalItems(response.meta?.total_items || 0);
        } catch (error) {
            console.error('Failed to load about items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingItem(null);
        setFormData({
            title: { uz: '', ru: '', en: '' },
            description: { uz: '', ru: '', en: '' },
            order_num: items.length + 1,
            link_url: '',
        });
        setIsModalOpen(true);
    };

    const handleEdit = (item: About) => {
        setEditingItem(item);
        setFormData({
            title: item.title,
            description: item.description,
            order_num: item.order_num,
            link_url: item.link_url || '',
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (item: About) => {
        if (!confirm('Ushbu ma\'lumotni o\'chirishni xohlaysizmi?')) {
            return;
        }

        try {
            await aboutService.delete(item.id);
            loadData();
        } catch (error) {
            console.error('Failed to delete item:', error);
            alert('Ma\'lumotni o\'chirishda xatolik');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingItem) {
                await aboutService.update(editingItem.id, formData);
            } else {
                await aboutService.create(formData);
            }
            setIsModalOpen(false);
            loadData();
        } catch (error: any) {
            console.error('Failed to save item:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Ma\'lumotni saqlashda xatolik';
            alert(`Xatolik: ${errorMessage}`);
        }
    };

    const columns = [
        {
            key: 'title',
            header: 'Sarlavha',
            render: (item: About) => item.title?.uz || item.title?.ru || item.title?.en || 'Noma\'lum'
        },
        {
            key: 'order_num',
            header: 'Tartib',
        },
        {
            key: 'actions',
            header: 'Amallar',
            render: (item: About) => (
                <div className="flex gap-2">
                    <Button onClick={() => handleEdit(item)} variant="outline" size="sm">
                        Tahrirlash
                    </Button>
                    <Button onClick={() => handleDelete(item)} variant="destructive" size="sm">
                        O'chirish
                    </Button>
                </div>
            ),
        },
    ];

    if (loading) {
        return <div className="text-center py-8">Yuklanmoqda...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Biz haqimizda</h1>
                <Button onClick={handleCreate}>Ma'lumot qo'shish</Button>
            </div>

            <SearchFilters
                configs={[{ key: 'title', label: 'Sarlavha', type: 'text', placeholder: 'Sarlavha bo\'yicha qidirish...' }]}
                onFilter={setActiveFilters}
            />

            <Table data={items} columns={columns} />

            {/* <Pagination
                currentPage={page}
                totalItems={totalItems}
                perPage={limit}
                onPageChange={setPage}
            /> */}


            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? 'Ma\'lumotni tahrirlash' : 'Ma\'lumot qo\'shish'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <MultilangInput
                        label="Sarlavha"
                        value={formData.title}
                        onChange={(title) => setFormData({ ...formData, title })}
                        required
                    />
                    <MultilangInput
                        label="Tavsif"
                        value={formData.description}
                        onChange={(description) => setFormData({ ...formData, description })}
                        required
                    />
                    <Input
                        label="Havola URL"
                        value={formData.link_url}
                        onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    />
                    <Input
                        label="Tartib raqami"
                        type="number"
                        value={formData.order_num}
                        onChange={(e) => setFormData({ ...formData, order_num: parseInt(e.target.value) || 1 })}
                        required
                    />
                    <div className="flex gap-2 justify-end pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                            Bekor qilish
                        </Button>
                        <Button type="submit">Saqlash</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
