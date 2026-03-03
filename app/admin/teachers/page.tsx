'use client';

import { useState, useEffect } from 'react';
import { Teacher } from '@/types';
import { teacherService } from '@/services/teacher.service';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { SearchFilters, FilterConfig } from '@/components/ui/SearchFilters';
import { Pagination } from '@/components/ui/Pagination';

export default function TeachersPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 10;
    const [formData, setFormData] = useState({

        name: '',
        login: '',
        phone_number: '',
    });

    useEffect(() => {
        loadData();
    }, [activeFilters, page]);


    const loadData = async () => {
        try {
            setLoading(true);
            const response = await teacherService.getAll(page, limit, activeFilters);
            setTeachers(response.data);
            const total = response.meta?.total_items ||
                (response as any).count ||
                (response as any).total_items ||
                (response as any).total ||
                0;
            setTotalItems(total);
        } catch (error) {
            // Error handling
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingTeacher(null);
        setFormData({
            name: '',
            login: '',
            phone_number: '',
        });
        setIsModalOpen(true);
    };

    const handleEdit = (teacher: Teacher) => {
        setEditingTeacher(teacher);
        setFormData({
            name: teacher.name,
            login: teacher.login,
            phone_number: teacher.phone_number,
        });
        setIsModalOpen(true);
    };


    const handleDelete = async (teacher: Teacher) => {
        if (!confirm('Ushbu o\'qituvchini o\'chirishni xohlaysizmi?')) {
            return;
        }

        try {
            await teacherService.delete(teacher.id);
            loadData();
        } catch (error) {
            alert('O\'qituvchini o\'chirishda xatolik');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingTeacher) {
                await teacherService.update(editingTeacher.id, formData);
            } else {
                await teacherService.create(formData);
            }
            setIsModalOpen(false);
            loadData();
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.message || 'O\'qituvchini saqlashda xatolik';
            alert(`Xatolik: ${message}`);
        }
    };

    const columns = [
        {
            key: 'name',
            header: 'Ism',
            render: (item: Teacher) => item.name
        },
        {
            key: 'login',
            header: 'Login',
            render: (item: Teacher) => item.login
        },
        {
            key: 'phone_number',
            header: 'Telefon raqami',
            render: (item: Teacher) => item.phone_number
        },
        {
            key: 'actions',
            header: 'Amallar',
            render: (item: Teacher) => (
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

    const filterConfigs: FilterConfig[] = [
        { key: 'name', label: 'Ism', type: 'text', placeholder: 'Ism bo\'yicha qidirish...' },
        { key: 'phone_number', label: 'Telefon', type: 'text', placeholder: 'Telefon bo\'yicha qidirish...' },
    ];

    if (loading && teachers.length === 0) {
        return <div className="text-center py-8">Yuklanmoqda...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">O'qituvchilar</h1>
                <Button onClick={handleCreate}>O'qituvchi qo'shish</Button>
            </div>

            <SearchFilters configs={filterConfigs} onFilter={setActiveFilters} />

            <Table data={teachers} columns={columns} />

            <Pagination
                currentPage={page}
                totalItems={totalItems || teachers.length}
                perPage={limit}
                onPageChange={setPage}
            />


            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingTeacher ? 'O\'qituvchini tahrirlash' : 'O\'qituvchi qo\'shish'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Ism"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Login"
                        value={formData.login}
                        onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                        required
                    />
                    <Input
                        label="Telefon raqami"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
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
