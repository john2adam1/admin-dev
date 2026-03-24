'use client';

import { useState, useEffect } from 'react';
import { Notification, Course, NotificationCreateBody } from '@/types';
import { notificationService } from '@/services/notification.service';
import { courseService } from '@/services/course.service';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { MultilangInput } from '@/components/ui/MultilangInput';
import { Button } from '@/components/ui/Button';
import { SearchFilters, FilterConfig } from '@/components/ui/SearchFilters';
import { Pagination } from '@/components/ui/Pagination';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;


  const [formData, setFormData] = useState({
    course_id: '',
    title: { uz: '', ru: '', en: '' },
    message: { uz: '', ru: '', en: '' },
    targetType: 'all' // 'all' | 'selected'
  });

  useEffect(() => {
    loadData();
  }, [activeFilters, page]);


  const loadData = async () => {
    try {
      setLoading(true);
      const [notifsResponse, coursesResponse] = await Promise.all([
        notificationService.getAll(page, limit, activeFilters),
        courseService.getAllWithoutPagination()
      ]);
      setNotifications(notifsResponse.data);
      const total = notifsResponse.meta?.total_items ||
        (notifsResponse as any).count ||
        (notifsResponse as any).total_items ||
        (notifsResponse as any).total ||
        0;
      setTotalItems(total);
      setCourses(coursesResponse.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingNotification(null);
    setFormData({
      course_id: '',
      title: { uz: '', ru: '', en: '' },
      message: { uz: '', ru: '', en: '' },
      targetType: 'all'
    });
    setIsModalOpen(true);
  };

  const handleEdit = (notification: Notification) => {
    setEditingNotification(notification);
    setFormData({
      course_id: notification.course_id || '',
      title: notification.title || { uz: '', ru: '', en: '' },
      message: notification.message || { uz: '', ru: '', en: '' },
      targetType: notification.type || 'all'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (notification: Notification) => {
    if (!confirm(`Ushbu xabarnomani o'chirishni xohlaysizmi?`)) {
      return;
    }

    try {
      await notificationService.delete(notification.id);
      loadData();
    } catch (error) {
      console.error('Failed to delete notification:', error);
      alert('Xabarnomani o\'chirishda xatolik');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.targetType === 'selected' && (!formData.course_id || formData.course_id.trim() === '')) {
      alert('Kursga oid xabarnoma uchun kursni tanlang');
      return;
    }

    // Validate multilanguage fields - ensure no empty strings
    const titleUz = formData.title.uz?.trim() || '';
    const titleRu = formData.title.ru?.trim() || '';
    const titleEn = formData.title.en?.trim() || '';
    const messageUz = formData.message.uz?.trim() || '';
    const messageRu = formData.message.ru?.trim() || '';
    const messageEn = formData.message.en?.trim() || '';

    if (!titleUz || !titleRu || !titleEn) {
      alert('Sarlavhani barcha tillarda to\'ldiring (UZ, RU, EN)');
      return;
    }

    if (!messageUz || !messageRu || !messageEn) {
      alert('Xabarni barcha tillarda to\'ldiring (UZ, RU, EN)');
      return;
    }

    // Clean the data
    const cleanTitle = { uz: titleUz, ru: titleRu, en: titleEn };
    const cleanMessage = { uz: messageUz, ru: messageRu, en: messageEn };

    try {
      // ... same logic
      if (editingNotification) {
        // Include type and course_id in update payload to allow changing audience
        const updatePayload: any = {
          title: cleanTitle,
          message: cleanMessage,
          type: formData.targetType as 'all' | 'selected',
        };

        if (updatePayload.type === 'selected' && formData.course_id) {
          updatePayload.course_id = formData.course_id.trim();
        } else {
          updatePayload.course_id = null; // Clear course_id if type is 'all'
        }

        await notificationService.update(editingNotification.id, updatePayload);
      } else {
        // For creation, use model.NotificationCreateBody
        const createPayload: NotificationCreateBody = {
          title: cleanTitle,
          message: cleanMessage,
          type: formData.targetType as 'all' | 'selected',
        };

        // Only include course_id when type is 'selected'
        if (createPayload.type === 'selected' && formData.course_id) {
          createPayload.course_id = formData.course_id.trim();
        }

        await notificationService.create(createPayload);
      }

      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Failed to save notification:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Xabarnomani saqlashda xatolik';
      alert(`Xatolik: ${errorMessage}`);
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Sarlavha',
      render: (item: Notification) => item.title.uz || item.title.en
    },
    {
      key: 'message',
      header: 'Xabar',
      render: (item: Notification) => (
        <div className="max-w-md truncate">{item.message.uz || item.message.en}</div>
      ),
    },
    {
      key: 'type',
      header: 'Qabul qiluvchi',
      render: (item: Notification) => item.type === 'selected' ? 'Maxsus Kurs' : 'Barcha Foydalanuvchilar'
    },
    {
      key: 'created_at',
      header: 'Yaratilgan vaqti',
      render: (item: Notification) => new Date(item.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Amallar',
      render: (item: Notification) => (
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

  const courseOptions = [
    ...courses.map(c => ({ value: c.id, label: c.name?.uz || c.name?.ru || c.name?.en || 'Nomsiz Kurs' }))
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Xabarnomalar</h1>
        <Button onClick={handleCreate}>Xabarnoma yaratish</Button>
      </div>

      <SearchFilters
        configs={[
          { key: 'title', label: 'Sarlavha', type: 'text', placeholder: 'Sarlavha bo\'yicha qidirish...' },
          {
            key: 'type',
            label: 'Tur',
            type: 'select',
            options: [
              { value: 'all', label: 'Barcha Foydalanuvchilar' },
              { value: 'selected', label: 'Maxsus Kurs' }
            ]
          }
        ]}
        onFilter={setActiveFilters}
      />

      <Table
        data={notifications}
        columns={columns}
      />

      <Pagination
        currentPage={page}
        totalItems={totalItems || notifications.length}
        perPage={limit}
        onPageChange={setPage}
      />


      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingNotification ? 'Xabarnomani tahrirlash' : 'Xabarnoma yaratish'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingNotification && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Auditoriya</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="targetType"
                    value="all"
                    checked={formData.targetType === 'all'}
                    onChange={() => setFormData({ ...formData, targetType: 'all', course_id: '' })}
                  />
                  Barcha Foydalanuvchilar
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="targetType"
                    value="selected"
                    checked={formData.targetType === 'selected'}
                    onChange={() => setFormData({ ...formData, targetType: 'selected' })}
                  />
                  Tanlangan Kurs
                </label>
              </div>
            </div>
          )}

          {!editingNotification && formData.targetType === 'selected' && (
            <Select
              label="Kurs"
              options={courseOptions}
              value={formData.course_id}
              onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
              required
            />
          )}
          <MultilangInput
            label="Sarlavha"
            value={formData.title}
            onChange={(title) => setFormData({ ...formData, title })}
            required
          />
          <MultilangInput
            label="Xabar"
            value={formData.message}
            onChange={(message) => setFormData({ ...formData, message })}
            required
          />

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit">Saqlash</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}