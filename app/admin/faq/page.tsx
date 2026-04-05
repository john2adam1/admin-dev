'use client';

import { useState, useEffect } from 'react';
import { FAQ } from '@/types';
import { faqService } from '@/services/faq.service';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { MultilangInput } from '@/components/ui/MultilangInput';
import { SearchFilters, FilterConfig } from '@/components/ui/SearchFilters';
import { Pagination } from '@/components/ui/Pagination';

export default function FAQPage() {
    const [items, setItems] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<FAQ | null>(null);
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 10;

    const [formData, setFormData] = useState({
        question: { uz: '', ru: '', en: '' },
        answer: { uz: '', ru: '', en: '' },
        order_num: 1,
    });

    useEffect(() => {
        loadData();
    }, [activeFilters, page]);


    const loadData = async () => {
        try {
            setLoading(true);
            const response = await faqService.getAll(page, limit, activeFilters);
            setItems(response.data);
            const total = response.meta?.total_items ||
                (response as any).count ||
                (response as any).total_items ||
                (response as any).total ||
                0;
            setTotalItems(total);
        } catch (error) {
            console.error('Failed to load FAQs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingItem(null);
        setFormData({
            question: { uz: '', ru: '', en: '' },
            answer: { uz: '', ru: '', en: '' },
            order_num: items.length + 1,
        });
        setIsModalOpen(true);
    };

    const handleEdit = (item: FAQ) => {
        setEditingItem(item);
        setFormData({
            question: item.question || { uz: '', ru: '', en: '' },
            answer: item.answer || { uz: '', ru: '', en: '' },
            order_num: item.order_num || 1,
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (item: FAQ) => {
        if (!confirm('Ushbu savol-javobni o\'chirishni xohlaysizmi?')) {
            return;
        }

        try {
            await faqService.delete(item.id);
            loadData();
        } catch (error) {
            console.error('Failed to delete FAQ:', error);
            alert('Savol-javobni o\'chirishda xatolik');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const submitData = {
            ...formData,
            order_num: Number(formData.order_num)
        };

        try {
            if (editingItem) {
                await faqService.update(editingItem.id, submitData);
            } else {
                await faqService.create(submitData);
            }
            setIsModalOpen(false);
            loadData();
        } catch (error: any) {
            console.error('Failed to save FAQ:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Savol-javobni saqlashda xatolik';
            alert(`Xatolik: ${errorMessage}`);
        }
    };

    const columns = [
        {
            key: 'question',
            header: 'Savol',
            render: (item: FAQ) => item.question?.uz || item.question?.ru || item.question?.en || 'Noma\'lum'
        },
        {
            key: 'order_num',
            header: 'Tartib',
        },
        {
            key: 'actions',
            header: 'Amallar',
            render: (item: FAQ) => (
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
                <h1 className="text-3xl font-bold">Ko'p beriladigan savollar</h1>
                <Button onClick={handleCreate}>Savol-javob qo'shish</Button>
            </div>

            <SearchFilters
                configs={[{ key: 'question', label: 'Savol', type: 'text', placeholder: 'Savol bo\'yicha qidirish...' }]}
                onFilter={setActiveFilters}
            />

            <Table data={items} columns={columns} />

            <Pagination
                currentPage={page}
                totalItems={totalItems || items.length}
                perPage={limit}
                onPageChange={setPage}
            />


            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? 'Savol-javobni tahrirlash' : 'Savol-javob qo\'shish'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <MultilangInput
                        label="Savol"
                        value={formData.question}
                        onChange={(question) => setFormData({ ...formData, question })}
                        required
                    />
                    <MultilangInput
                        label="Javob"
                        value={formData.answer}
                        onChange={(answer) => setFormData({ ...formData, answer })}
                        required
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
