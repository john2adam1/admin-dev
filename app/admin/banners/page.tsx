'use client';

import { useState, useEffect, useRef } from 'react';
import { Banner } from '@/types';
import { bannerService } from '@/services/banner.service';
import { uploadService } from '@/services/upload.service';
import { getMediaUrl } from '@/lib/mediaUtils';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { MultilangInput } from '@/components/ui/MultilangInput';
import { Button } from '@/components/ui/Button';
import { SearchFilters, FilterConfig } from '@/components/ui/SearchFilters';
import { Pagination } from '@/components/ui/Pagination';
import { toast } from 'sonner';

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const limit = 10;


  // Using objects for multilingual support
  const [formData, setFormData] = useState({
    image_url: { uz: '', ru: '', en: '' },
    link_url: '',
    title: { uz: '', ru: '', en: '' },
    description: { uz: '', ru: '', en: '' },
    order_num: 1,
  });

  useEffect(() => {
    loadBanners();
  }, [activeFilters, page]);


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const res = await uploadService.upload(file);
      const url = res.url;
      // Apply same URL to all language variants
      setFormData(prev => ({ ...prev, image_url: { uz: url, ru: url, en: url } }));
      toast.success('Rasm muvaffaqiyatli yuklandi');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Rasmni yuklashda xatolik');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const loadBanners = async () => {
    try {
      setLoading(true);
      const response = await bannerService.getAll(page, limit, activeFilters);
      setBanners(response.data);
      const total = response.meta?.total_items ||
        (response as any).count ||
        (response as any).total_items ||
        (response as any).total ||
        0;
      setTotalItems(total);
    } catch (error) {
      console.error('Failed to load banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBanner(null);
    setFormData({
      image_url: { uz: '', ru: '', en: '' },
      link_url: '',
      title: { uz: '', ru: '', en: '' },
      description: { uz: '', ru: '', en: '' },
      order_num: banners.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      image_url: banner.image_url || { uz: '', ru: '', en: '' },
      link_url: banner.link_url || '',
      title: banner.title || { uz: '', ru: '', en: '' },
      description: banner.description || { uz: '', ru: '', en: '' },
      order_num: banner.order_num || 1,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (banner: Banner) => {
    if (!confirm('Ushbu bannerni o\'chirishni xohlaysizmi?')) {
      return;
    }

    try {
      await bannerService.delete(banner.id);
      loadBanners();
    } catch (error) {
      console.error('Failed to delete banner:', error);
      alert('Bannerni o\'chirishda xatolik');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const bannerData = {
      image_url: formData.image_url,
      link_url: formData.link_url,
      title: formData.title,
      description: formData.description,
      order_num: Number(formData.order_num),
    };

    try {
      if (editingBanner) {
        await bannerService.update(editingBanner.id, bannerData);
      } else {
        await bannerService.create(bannerData);
      }
      setIsModalOpen(false);
      loadBanners();
    } catch (error: any) {
      console.error('Failed to save banner:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Bannerni saqlashda xatolik';
      alert(`Xatolik: ${errorMessage}`);
    }
  };

  const columns = [
    {
      key: 'image_url',
      header: 'Rasm',
      render: (item: Banner) => (
        <img src={getMediaUrl(item.image_url?.uz || item.image_url?.ru || item.image_url?.en || '')} alt="Banner" className="w-20 h-12 object-cover" />
      ),
    },
    {
      key: 'title',
      header: 'Sarlavha',
      render: (item: Banner) => item.title?.uz || item.title?.ru || item.title?.en || 'Noma\'lum'
    },
    { key: 'link_url', header: 'Havola' },
    { key: 'order_num', header: 'Tartib' },
    {
      key: 'created_at',
      header: 'Yaratilgan vaqti',
      render: (item: Banner) => new Date(item.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Amallar',
      render: (item: Banner) => (
        <div className="flex gap-2">
          <Button onClick={() => handleEdit(item)} variant="outline" size="sm">
            Tahrirlash
          </Button>
          <Button onClick={() => handleDelete(item)} variant="destructive" size="sm">
            O'chirish
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return <div className="text-center py-8">Yuklanmoqda...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Bannerlar</h1>
        <Button onClick={handleCreate}>Banner yaratish</Button>
      </div>

      <SearchFilters
        configs={[{ key: 'title', label: 'Sarlavha', type: 'text', placeholder: 'Sarlavha bo\'yicha qidirish...' }]}
        onFilter={setActiveFilters}
      />

      <Table
        data={banners}
        columns={columns}
      />

      <Pagination
        currentPage={page}
        totalItems={totalItems || banners.length}
        perPage={limit}
        onPageChange={setPage}
      />


      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBanner ? 'Bannerni tahrirlash' : 'Banner yaratish'}
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
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Rasm</label>
            <div className="flex flex-col gap-3">
              {(formData.image_url.uz || formData.image_url.ru || formData.image_url.en) && (
                <div className="relative w-full h-40 rounded-md overflow-hidden border bg-gray-50">
                  <img
                    src={getMediaUrl(formData.image_url.uz || formData.image_url.ru || formData.image_url.en)}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? 'Yuklanmoqda...' : (formData.image_url.uz ? '📷 Rasmni almashtirish' : '📷 Rasm yuklash')}
              </Button>
            </div>
          </div>
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

