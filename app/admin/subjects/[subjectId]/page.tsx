'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Subject, Course, Teacher, CoursePriceOption, Tariff, CourseUpdateBody } from '@/types';
import { subjectService } from '@/services/subject.service';
import { courseService } from '@/services/course.service';
import { teacherService } from '@/services/teacher.service';
import { tariffService } from '@/services/tariff.service';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { CourseUsersModal } from '@/components/ui/CourseUsersModal'; // New import
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { MultilangInput } from '@/components/ui/MultilangInput';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/separator';
import { SearchFilters, FilterConfig } from '@/components/ui/SearchFilters';
import { Pagination } from '@/components/ui/Pagination';
import { toast } from 'sonner';

export default function SubjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId as string;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCourseUsersModalOpen, setIsCourseUsersModalOpen] = useState(false); // New state
  const [selectedCourseForUsers, setSelectedCourseForUsers] = useState<Course | null>(null); // New state

  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<{
    subject_id: string;
    teacher_id: string;
    image_url: string;
    is_public: boolean;
    is_active: boolean;
    can_buy: boolean;
    order_num: number;
    price: CoursePriceOption[];
    name: { uz: string; ru: string; en: string };
    description: { uz: string; ru: string; en: string };
  }>({
    subject_id: subjectId,
    teacher_id: '',
    image_url: '',
    is_public: true,
    is_active: true,
    can_buy: true,
    order_num: 1,
    price: [],
    name: { uz: '', ru: '', en: '' },
    description: { uz: '', ru: '', en: '' },
  });

  useEffect(() => {
    if (subjectId) {
      loadData();
    }
  }, [subjectId, activeFilters, page]);


  const loadData = async () => {
    try {
      const [subjectData, coursesResponse, teachersResponse, tariffsResponse] = await Promise.all([
        subjectService.getById(subjectId),
        courseService.getAll(subjectId, page, limit, activeFilters), // Using filter
        teacherService.getAll(),
        tariffService.getAll(),
      ]);


      if (!subjectData) {
        router.push('/admin/subjects');
        return;
      }

      setSubject(subjectData);
      setCourses(coursesResponse.data);
      setCourses(coursesResponse.data);
      const total = coursesResponse.meta?.total_items ||
        (coursesResponse as any).count ||
        (coursesResponse as any).total_items ||
        (coursesResponse as any).total ||
        0;
      setTotalItems(total);
      setTeachers(teachersResponse.data);
      setTariffs(tariffsResponse.data);

    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCourse(null);
    setFormData({
      subject_id: subjectId,
      teacher_id: teachers[0]?.id || '',
      image_url: '',
      is_public: true,
      is_active: true,
      can_buy: true,
      order_num: courses.length + 1,
      price: [],
      name: { uz: '', ru: '', en: '' },
      description: { uz: '', ru: '', en: '' },
    });
    setIsModalOpen(true);
  };

  const [isEditLoading, setIsEditLoading] = useState(false);

  const handleEdit = async (course: Course) => {
    try {
      setIsEditLoading(true);
      const fullCourse = await courseService.getById(course.id);
      console.log('Full Course Data from Backend:', fullCourse);
      setEditingCourse(fullCourse);
      setFormData({
        subject_id: fullCourse.subject_id,
        teacher_id: fullCourse.teacher_id || '',
        image_url: fullCourse.image_url,
        is_public: !!fullCourse.is_public,
        is_active: !!fullCourse.is_active,
        can_buy: !!fullCourse.can_buy,
        order_num: fullCourse.order_num,
        price: Array.isArray(fullCourse.price) ? fullCourse.price : [],
        name: fullCourse.name,
        description: fullCourse.description,
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch course details:', error);
      alert('Kurs ma\'lumotlarini yuklashda xatolik');
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleCourseUsersClick = (course: Course) => {
    setSelectedCourseForUsers(course);
    setIsCourseUsersModalOpen(true);
  };

  const handleDelete = async (course: Course) => {
    if (!confirm(`Ushbu kursni o'chirishni xohlaysizmi?`)) {
      return;
    }

    try {
      await courseService.delete(course.id);
      loadData();
    } catch (error) {
      console.error('Failed to delete course:', error);
      alert('Kursni o\'chirishda xatolik');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // If course is public (free) or prices are removed, explicitly set price to null
      // to ensure the backend removes existing prices. 
      // Some backends ignore empty arrays [] but process null for clearing.
      const submissionData: CourseUpdateBody = {
        ...formData,
        price: (formData.is_public || formData.price.length === 0) ? [] : formData.price
      };

      console.log('Saving course data:', submissionData);

      if (editingCourse) {
        await courseService.update(editingCourse.id, submissionData);
        toast.success('Kurs muvaffaqiyatli yangilandi');
      } else {
        await courseService.create(submissionData as any);
        toast.success('Kurs muvaffaqiyatli yaratildi');
      }
      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Failed to save course:', error);
      console.error('Error response data:', error.response?.data);

      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Kursni saqlashda xatolik';
      toast.error(`Xatolik: ${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      </div>
    );
  }

  if (!subject) {
    return null;
  }

  const breadcrumbItems = [
    { label: 'Fanlar', href: '/admin/subjects' },
    { label: subject.name.uz || subject.name.ru || subject.name.en },
  ];

  const teacherOptions = teachers.map((t) => ({
    value: t.id,
    label: `${t.name} (${t.phone_number})`,
  }));

  return (
    <div className="space-y-6">
      <Breadcrumb items={breadcrumbItems} />

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {subject.name.uz || subject.name.ru || subject.name.en}
          </h1>
          <p className="text-muted-foreground mt-1">Ushbu fanga tegishli kurslarni boshqarish</p>
        </div>
        <Button onClick={handleCreate}>Kurs qo'shish</Button>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Kurslar</CardTitle>
              <CardDescription>
                {courses.length === 0
                  ? 'Ushbu fanda kurslar mavjud emas'
                  : `${courses.length} ta kurs mavjud`}
              </CardDescription>
            </div>
          </div>
          <div className="mt-4">
            <SearchFilters
              configs={[
                { key: 'name', label: 'Kurs nomi', type: 'text', placeholder: 'Kurs nomi bo\'yicha qidirish...' },
                { key: 'is_public', label: 'Ommaviy', type: 'boolean' }
              ]}
              onFilter={setActiveFilters}
            />
          </div>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">Kurslar mavjud emas</p>
              <Button onClick={handleCreate}>Birinchi kursni yaratish</Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses
                .sort((a, b) => a.order_num - b.order_num)
                .map((course) => (
                  <Card key={course.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Link href={`/admin/subjects/${subjectId}/courses/${course.id}`}>
                            <CardTitle className="hover:text-primary transition-colors cursor-pointer line-clamp-2">
                              {course.name?.uz || course.name?.ru || course.name?.en || 'Nomsiz kurs'}
                            </CardTitle>
                          </Link>
                          <CardDescription className="mt-2 line-clamp-2">
                            {course.description?.uz || course.description?.ru || course.description?.en || ''}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant={course.is_public ? 'success' : 'secondary'}>
                          {course.is_public ? 'Ommaviy' : 'Shaxsiy'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-6"
                          onClick={() => handleCourseUsersClick(course)}
                        >
                          Foydalanuvchilar
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(course)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={isEditLoading}
                        >
                          {isEditLoading && editingCourse?.id === course.id ? 'Yuklanmoqda...' : 'Tahrirlash'}
                        </Button>
                        <Button
                          onClick={() => handleDelete(course)}
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
        </CardContent>
      </Card>

      <Pagination
        currentPage={page}
        totalItems={totalItems}
        perPage={limit}
        onPageChange={setPage}
      />

      <CourseUsersModal
        isOpen={isCourseUsersModalOpen}
        onClose={() => {
          setIsCourseUsersModalOpen(false);
          setSelectedCourseForUsers(null);
        }}
        course={selectedCourseForUsers}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? 'Kursni tahrirlash' : 'Kurs qo\'shish'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <MultilangInput
            label="Nom"
            value={formData.name}
            onChange={(name) => setFormData({ ...formData, name })}
            required
          />
          <MultilangInput
            label="Tavsif"
            value={formData.description}
            onChange={(description) => setFormData({ ...formData, description })}
            required
          />
          {!formData.is_public && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Narx opsiyalari</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      price: [...formData.price, {
                        duration: tariffs[0]?.duration || 1,
                        price: 0,
                        tariff_id: tariffs[0]?.id
                      }],
                    });
                  }}
                >
                  + Opsiya qo'shish
                </Button>
              </div>
              {formData.price.map((option, index) => (
                <div key={index} className="flex gap-2 items-end mb-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Tarif</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md"
                      value={option.tariff_id}
                      onChange={(e) => {
                        const selectedTariff = tariffs.find(t => t.id === e.target.value);
                        if (selectedTariff) {
                          const newPrice = [...formData.price];
                          newPrice[index].duration = selectedTariff.duration;
                          newPrice[index].tariff_id = selectedTariff.id;
                          setFormData({ ...formData, price: newPrice });
                        }
                      }}
                      required
                    >
                      {tariffs.map((tariff) => (
                        <option key={tariff.id} value={tariff.id}>
                          {tariff.name} ({tariff.duration} oy)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Narx</label>
                    <Input
                      type="number"
                      value={option.price}
                      onChange={(e) => {
                        const newPrice = [...formData.price];
                        newPrice[index].price = parseInt(e.target.value) || 0;
                        setFormData({ ...formData, price: newPrice });
                      }}
                      placeholder="Narx"
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      const newPrice = formData.price.filter((_, i) => i !== index);
                      setFormData({ ...formData, price: newPrice });
                    }}
                  >
                    X
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Select
            label="O'qituvchi"
            options={teacherOptions}
            value={formData.teacher_id}
            onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
            required
          />
          <Input
            label="Rasm URL"
            value={formData.image_url}
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
          <div className="flex items-center justify-between py-2">
            <label className="text-sm font-medium">Ommaviymi</label>
            <Switch
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <label className="text-sm font-medium">Sotib olish mumkinmi</label>
            <Switch
              checked={formData.can_buy}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_buy: checked }))}
            />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

