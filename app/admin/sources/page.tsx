'use client';

import { useState, useEffect } from 'react';
import { Source, Lesson } from '@/types';
import { sourceService } from '@/services/source.service';
import { lessonService } from '@/services/lesson.service';
import { uploadService } from '@/services/upload.service';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { MultilangInput } from '@/components/ui/MultilangInput';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { getMediaUrl } from '@/lib/mediaUtils';

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');

  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const [formData, setFormData] = useState({
    lesson_id: '',
    name: { uz: '', ru: '', en: '' },
    url: { uz: '', ru: '', en: '' },
    type: 'video' as 'video' | 'document' | 'test',
    order_num: 1,
  });

  useEffect(() => {
    loadData();
  }, [page, selectedLessonId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sourcesResponse, lessonsResponse] = await Promise.all([
        sourceService.getAll(selectedLessonId || undefined, page, limit),
        lessonService.getAll(undefined, 1, 1000)
      ]);
      setSources(sourcesResponse.data);
      const total = sourcesResponse.meta?.total_items ||
        (sourcesResponse as any).count ||
        (sourcesResponse as any).total_items ||
        (sourcesResponse as any).total ||
        0;
      setTotalItems(total);
      setLessons(lessonsResponse.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = (type: 'video' | 'document' | 'test' = 'video') => {
    setEditingSource(null);
    setFormData({
      lesson_id: selectedLessonId || '',
      name: { uz: '', ru: '', en: '' },
      url: { uz: '', ru: '', en: '' },
      type,
      order_num: totalItems + 1,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (source: Source) => {
    setEditingSource(source);
    setFormData({
      lesson_id: source.lesson_id,
      name: source.name,
      url: source.url,
      type: source.type,
      order_num: source.order_num,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (source: Source) => {
    if (!confirm(`Ushbu manbani o'chirishni xohlaysizmi?`)) {
      return;
    }

    try {
      await sourceService.delete(source.id);
      loadData();
    } catch (error) {
      console.error('Failed to delete source:', error);
      alert('Manbani o\'chirishda xatolik');
    }
  };

  const handleFileUpload = async (file: File, language: 'uz' | 'ru' | 'en') => {
    try {
      setUploading(true);
      const uploadResult = await uploadService.upload(file);
      setFormData({
        ...formData,
        url: {
          ...formData.url,
          [language]: uploadResult.url,
        },
      });
      alert('Fayl muvaffaqiyatli yuklandi!');
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Fayl yuklashda xatolik');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.lesson_id || formData.lesson_id.trim() === '') {
      alert('Iltimos, darsni tanlang');
      return;
    }

    // Validate multilanguage fields
    const nameUz = formData.name.uz?.trim() || '';
    const nameRu = formData.name.ru?.trim() || '';
    const nameEn = formData.name.en?.trim() || '';

    if (!nameUz || !nameRu || !nameEn) {
      alert('Iltimos, nomni barcha tillarda to\'ldiring (UZ, RU, EN)');
      return;
    }

    // At least one URL should be provided
    const urlUz = formData.url.uz?.trim() || '';
    const urlRu = formData.url.ru?.trim() || '';
    const urlEn = formData.url.en?.trim() || '';

    if (!urlUz && !urlRu && !urlEn) {
      alert('Iltimos, kamida bitta URL kiriting yoki fayl yuklang');
      return;
    }

    try {
      const payload = {
        lesson_id: formData.lesson_id,
        name: { uz: nameUz, ru: nameRu, en: nameEn },
        url: { uz: urlUz, ru: urlRu, en: urlEn },
        type: formData.type,
        order_num: formData.order_num,
      };

      if (editingSource) {
        await sourceService.update(editingSource.id, payload);
      } else {
        await sourceService.create(payload);
      }

      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to save source:', error);
      alert('Manbani saqlashda xatolik');
    }
  };

  const columns = [
    {
      key: 'lesson',
      header: 'Dars',
      render: (item: Source) => {
        const lesson = lessons.find(l => l.id === item.lesson_id);
        return lesson ? (lesson.name?.uz || lesson.name?.ru || lesson.name?.en || 'Noma\'lum') : 'Noma\'lum';
      },
    },
    {
      key: 'name',
      header: 'Nom',
      render: (item: Source) => item.name?.uz || item.name?.ru || item.name?.en || 'Noma\'lum'
    },
    {
      key: 'type',
      header: 'Tur',
      render: (item: Source) => (
        <span className={`px-2 py-1 rounded text-xs ${item.type === 'video' ? 'bg-blue-100 text-blue-800' :
          item.type === 'document' ? 'bg-green-100 text-green-800' :
            'bg-purple-100 text-purple-800'
          }`}>
          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
        </span>
      ),
    },
    {
      key: 'url',
      header: 'URL',
      render: (item: Source) => (
        <a
          href={getMediaUrl(item.url?.uz || item.url?.ru || item.url?.en || '')}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline flex items-center gap-1.5 truncate max-w-xs"
          download={item.type !== 'video'}
        >
          {item.type !== 'video' && (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          )}
          {item.url?.uz || item.url?.ru || item.url?.en || 'URL yo\'q'}
        </a>
      ),
    },
    {
      key: 'order_num',
      header: 'Tartib',
    },
    {
      key: 'actions',
      header: 'Amallar',
      render: (item: Source) => (
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

  const lessonOptions = lessons.map(l => ({
    value: l.id,
    label: l.name?.uz || l.name?.ru || l.name?.en || 'Nomsiz dars'
  }));

  const sourceTypeOptions = [
    { value: 'video', label: 'Video' },
    { value: 'document', label: 'Hujjat (PDF)' },
    { value: 'test', label: 'Test (PDF)' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manbalar</h1>
        <div className="flex gap-2">
          <Button onClick={() => handleCreate('video')}>Video qo'shish</Button>
          <Button onClick={() => handleCreate('document')} variant="outline">Hujjat qo'shish</Button>
          <Button onClick={() => handleCreate('test')} variant="secondary">Test qo'shish</Button>
        </div>
      </div>

      <div className="mb-4">
        <Select
          label="Dars bo'yicha filtrlash"
          options={[
            { value: '', label: 'Barcha darslar' },
            ...lessonOptions
          ]}
          value={selectedLessonId}
          onChange={(e) => {
            setSelectedLessonId(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <Table
        data={sources}
        columns={columns}
      />

      <Pagination
        currentPage={page}
        totalItems={totalItems || sources.length}
        perPage={limit}
        onPageChange={setPage}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSource ? 'Manbani tahrirlash' : 'Manba yaratish'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Dars"
            options={lessonOptions}
            value={formData.lesson_id}
            onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
            required
          />

          <Select
            label="Tur"
            options={sourceTypeOptions}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'video' | 'document' | 'test' })}
            required
          />

          <MultilangInput
            label="Nom"
            value={formData.name}
            onChange={(name) => setFormData({ ...formData, name })}
            required
          />

          <div className="space-y-4">
            <label className="text-sm font-medium">
              {formData.type === 'video' ? 'YouTube URLlari' : 'URLlar yoki Fayl Yuklash'}
            </label>
            {(['uz', 'ru', 'en'] as const).map((lang) => (
              <div key={lang} className="space-y-2">
                <label className="text-xs font-medium uppercase">{lang}</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={formData.url[lang] || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      url: { ...formData.url, [lang]: e.target.value }
                    })}
                    placeholder={
                      formData.type === 'video'
                        ? `${lang.toUpperCase()} YouTube URLini kiriting`
                        : `${lang.toUpperCase()} URLini kiriting yoki fayl yuklang`
                    }
                    className="flex-1"
                  />
                  {formData.type !== 'video' && (
                    <>
                      <input
                        type="file"
                        id={`file-upload-${lang}`}
                        accept="application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, lang);
                          }
                        }}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`file-upload-${lang}`)?.click()}
                        disabled={uploading}
                      >
                        {uploading ? 'Yuklanmoqda...' : 'Yuklash'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Input
            label="Tartib raqami"
            type="number"
            value={formData.order_num}
            onChange={(e) => setFormData({ ...formData, order_num: parseInt(e.target.value) || 1 })}
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
