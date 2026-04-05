'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Subject } from '@/types';
import { subjectService } from '@/services/subject.service';
import { getMediaUrl } from '@/lib/mediaUtils';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { MultilangInput } from '@/components/ui/MultilangInput';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SearchFilters, FilterConfig } from '@/components/ui/SearchFilters';
import { Pagination } from '@/components/ui/Pagination';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;
  const [formData, setFormData] = useState({

    image_url: '',
    order_num: 1,
    name: { uz: '', ru: '', en: '' },
  });

  useEffect(() => {
    loadSubjects();
  }, [activeFilters, page]);


  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await subjectService.getAll(page, limit, activeFilters);
      setSubjects(response.data);
      const total = response.meta?.total_items ||
        (response as any).count ||
        (response as any).total_items ||
        (response as any).total ||
        0;
      setTotalItems(total);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSubject(null);
    setFormData({
      image_url: '',
      order_num: subjects.length + 1,
      name: { uz: '', ru: '', en: '' },
    });
    setIsModalOpen(true);
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      image_url: subject.image_url,
      order_num: subject.order_num,
      name: subject.name,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (subject: Subject) => {
    if (!confirm(`Ushbu fanni o'chirishni xohlaysizmi?`)) {
      return;
    }

    try {
      await subjectService.delete(subject.id);
      loadSubjects();
    } catch (error) {
      console.error('Failed to delete subject:', error);
      alert('Fanni o\'chirishda xatolik');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSubject) {
        await subjectService.update(editingSubject.id, formData);
      } else {
        await subjectService.create(formData);
      }
      setIsModalOpen(false);
      loadSubjects();
    } catch (error) {
      console.error('Failed to save subject:', error);
      alert('Fanni saqlashda xatolik');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Fanlar' }]} />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fanlar</h1>
          <p className="text-muted-foreground mt-1">
            Fanlarni boshqarish
          </p>
        </div>
        <Button onClick={handleCreate}>Fan yaratish</Button>
      </div>

      <SearchFilters
        configs={[{ key: 'name', label: 'Nom', type: 'text', placeholder: 'Nom bo\'yicha qidirish...' }]}
        onFilter={setActiveFilters}
      />

      <Separator />

      {subjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Fanlar mavjud emas</p>
            <Button onClick={handleCreate}>Birinchi fanni yarating</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects
            .sort((a, b) => a.order_num - b.order_num)
            .map((subject) => (
              <Card key={subject.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Link href={`/admin/subjects/${subject.id}`}>
                        <CardTitle className="hover:text-primary transition-colors cursor-pointer">
                          {subject.name?.uz || subject.name?.ru || subject.name?.en || 'Noma\'lum'}
                        </CardTitle>
                      </Link>
                      <CardDescription className="mt-1">
                        Tartib: {subject.order_num}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(subject)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      Tahrirlash
                    </Button>
                    <Button
                      onClick={() => handleDelete(subject)}
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                    >
                      O'chirish
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      <Pagination
        currentPage={page}
        totalItems={totalItems || subjects.length}
        perPage={limit}
        onPageChange={setPage}
      />


      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Fanni tahrirlash' : 'Fan yaratish'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <MultilangInput
            label="Nom"
            value={formData.name}
            onChange={(name) => setFormData({ ...formData, name })}
            required
          />
          <Input
            label="Rasm URL"
            value={getMediaUrl(formData.image_url)}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
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

