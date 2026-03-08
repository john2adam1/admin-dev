'use client';

import { useState, useEffect } from 'react';
import { User, Course, Tariff, CoursePermission } from '@/types';
import { getMultilangValue } from '@/lib/utils/multilang';
import { courseService } from '@/services/course.service';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { toast } from 'sonner';

interface UserCoursesModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    allCourses: Course[];
    allTariffs: Tariff[];
    showGrantForm?: boolean; // Optional prop to control if grant form should be shown
}

export function UserCoursesModal({ isOpen, onClose, user, allCourses, allTariffs, showGrantForm = false }: UserCoursesModalProps) {
    const [permissions, setPermissions] = useState<CoursePermission[]>([]);
    const [loading, setLoading] = useState(false);
    const [isGranting, setIsGranting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(50); // Increased limit to ensure recent courses are seen
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [hasNext, setHasNext] = useState(false);

    // Grant Form State
    const [grantForm, setGrantForm] = useState({
        courseId: '',
        tariffId: '',
    });

    useEffect(() => {
        if (isOpen && user) {
            if (!showGrantForm) {
                loadPermissions(1); // Reset to page 1 when modal opens
            }
            setIsGranting(false);
            setGrantForm({ courseId: '', tariffId: '' });
        }
    }, [isOpen, user?.id, showGrantForm]);

    const loadPermissions = async (page: number = currentPage) => {
        if (!user) return;
        setLoading(true);
        try {
            console.log(`Loading permissions for user ${user.id} page ${page}`);
            // Try user_id and userId and student_id to be safe
            const res = await courseService.getPermissions(page, limit, {
                user_id: user.id,
                userId: user.id,
                student_id: user.id
            } as any);
            console.log('Permissions loaded:', res);
            setPermissions(res.data);

            // Update pagination state from API response
            // The API returns: total, page, limit, total_page, has_previous, has_next directly
            setCurrentPage(res.page);
            setTotal(res.total);
            setTotalPages(res.total_page);
            setHasPrevious(res.has_previous);
            setHasNext(res.has_next);
        } catch (error) {
            console.error('Failed to load permissions:', error);
            toast.error('Ruxsatlarni yuklashda xatolik');
        } finally {
            setLoading(false);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            loadPermissions(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            loadPermissions(currentPage + 1);
        }
    };



    // ... existing useEffect ...



    const handleGrantAccess = async () => {
        console.log('>>> BUTTON CLICKED: handleGrantAccess started');
        if (!user || !grantForm.courseId || !grantForm.tariffId) {
            toast.error('Iltimos, kurs va tarifni tanlang');
            return;
        }

        const selectedTariff = allTariffs.find(t => t.id === grantForm.tariffId);
        if (!selectedTariff) {
            toast.error('Tarif topilmadi');
            return;
        }

        const selectedCourse = allCourses.find(c => c.id === grantForm.courseId);
        if (!selectedCourse) {
            toast.error('Kurs topilmadi');
            return;
        }

        // Validate that the course has a price option for this tariff
        // Both tariff.duration and priceOption.duration are in MONTHS
        const tariffDurationInMonths = Number(selectedTariff.duration);
        const hasPriceOption = selectedCourse.price?.some(priceOption => {
            const priceDurationInMonths = Number(priceOption.duration);
            return priceDurationInMonths === tariffDurationInMonths;
        });

        if (!hasPriceOption) {
            toast.error('Bu kurs uchun tanlangan tarif mavjud emas. Iltimos, avval kurs uchun narx belgilang.');
            return;
        }

        // Check if user already has this course locally (in current page)
        // Check if active (Active = ended_at is in the future OR today)
        // We compare timestamps. We set the ended_at to the end of that day to be safe/inclusive.
        const isLocallyActive = permissions.some(p => {
            if (p.course_id !== grantForm.courseId) return false;
            const endDate = new Date(p.ended_at);
            // set end date to end of day to be inclusive
            endDate.setHours(23, 59, 59, 999);
            return endDate > new Date();
        });

        if (isLocallyActive) {
            toast.error('Foydalanuvchi allaqachon ushbu kursga ega');
            return;
        }

        setIsSaving(true);
        try {
            // Pre-check: Fetch permissions specifically for this course from backend
            // Increase limit to find older permissions if API doesn't support strict filtering
            console.log(`Checking existing permissions for User: ${user.id}, Course: ${grantForm.courseId}`);

            // Try user_id and userId and student_id to be safe
            const existingPermissions = await courseService.getPermissions(1, 100, {
                user_id: user.id,
                userId: user.id,
                student_id: user.id
            } as any);

            console.log('Existing permissions fetched:', existingPermissions.data);

            const hasActivePermission = existingPermissions.data.some(p => {
                if (p.course_id !== grantForm.courseId) return false;

                const endDate = new Date(p.ended_at);
                endDate.setHours(23, 59, 59, 999);
                const isActive = endDate > new Date();
                console.log(`Permission ${p.id}: Course ${p.course_id} Ends ${p.ended_at} -> Active? ${isActive}`);
                return isActive;
            });

            if (hasActivePermission) {
                console.warn('Blocked by pre-check: User has active permission');
                toast.error('Foydalanuvchi allaqachon ushbu kursga ega (Serverdagi ma\'lumot)');
                setIsSaving(false);
                return;
            }

            const payload = {
                user_id: user.id,
                course_id: grantForm.courseId,
                tariff_id: grantForm.tariffId,
                started_at: new Date().toISOString().split('T')[0], // YYYY-MM-DD
                ended_at: (() => {
                    const endDate = new Date();
                    // Add months, not days (selectedTariff.duration is in months)
                    endDate.setMonth(endDate.getMonth() + selectedTariff.duration);
                    return endDate.toISOString().split('T')[0]; // YYYY-MM-DD
                })()
            };

            console.log('Granting permission with payload:', payload);

            await courseService.grantPermission(payload);

            toast.success('Ruxsat berildi');
            setIsGranting(false);
            setGrantForm({ courseId: '', tariffId: '' });

            // Close the modal after success
            onClose();
            // Reload the list to show the new permission
            loadPermissions(1);
        } catch (error: any) {
            const errorData = error.response?.data;
            let errorMessage = 'Ruxsat berishda xatolik';
            let isKnownError = false;

            // Check for specific errors to handle gracefully
            if (errorData?.message) {
                const lowerMsg = errorData.message.toLowerCase();
                if (lowerMsg.includes('price option not found')) {
                    errorMessage = 'Bu kurs uchun tanlangan tarif mavjud emas. Iltimos, avval kurs uchun narx belgilang.';
                    isKnownError = true;
                } else if (lowerMsg.includes('course is still active')) {
                    errorMessage = 'Tizim xatosi: Serverda bu kurs allaqachon faol deb ko\'rsatilgan, lekin ro\'yxatda ko\'rinmayapti. Iltimos, ma\'lumotlar bazasini tekshiring.';
                    isKnownError = true;
                } else {
                    errorMessage = errorData.message;
                }
            } else if (errorData?.error) {
                errorMessage = errorData.error;
            }

            if (isKnownError) {
                console.warn('Handled known error during permission grant:', errorMessage);
            } else {
                console.error('Failed to grant permission:', error);
                console.error('Error response:', error.response?.data);
            }

            toast.error(`Xatolik: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    // ... handleRevoke ... (unchanged)

    const handleDeletePermission = async (row: CoursePermission) => {
        if (!confirm('Haqiqatan ham ushbu ruxsatni o\'chirmoqchimisiz? Bu amalni ortga qaytarib bo\'lmaydi.')) {
            return;
        }

        try {
            setLoading(true);
            await courseService.deletePermission(row.id);
            toast.success('Ruxsat muvaffaqiyatli o\'chirildi');
            loadPermissions(currentPage);
        } catch (error) {
            console.error('Failed to delete permission:', error);
            toast.error('Ruxsatni o\'chirishda xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            key: 'course',
            header: 'Kurs',
            render: (row: CoursePermission) => {
                const course = row.course || allCourses.find(c => c.id === row.course_id);
                return course ? getMultilangValue(course.name) : <span className="text-gray-400">Noma'lum kurs</span>;
            }
        },
        {
            key: 'tariff',
            header: 'Tarif',
            render: (row: CoursePermission) => {
                const tariff = row.tariff || allTariffs.find(t => t.id === row.tariff_id);
                return tariff ? getMultilangValue(tariff.name) : <span className="text-gray-400">Noma'lum tarif</span>;
            }
        },
        {
            key: 'started_at',
            header: 'Boshlanish',
            render: (row: CoursePermission) => new Date(row.started_at).toLocaleDateString(),
        },
        {
            key: 'ended_at',
            header: 'Tugash',
            render: (row: CoursePermission) => new Date(row.ended_at).toLocaleDateString(),
        },
        {
            key: 'status',
            header: 'Holat',
            render: (row: CoursePermission) => {
                const isActive = new Date(row.ended_at) > new Date();
                return (
                    <span className={`px-2 py-1 rounded text-xs ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {isActive ? 'Faol' : 'Yakunlangan'}
                    </span>
                );
            }
        },

    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Kurslar: ${user?.name || 'Foydalanuvchi'}`}>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Foydalanuvchi kurslari</h2>
                    {!isGranting && !showGrantForm && (
                        <Button onClick={() => setIsGranting(true)}>Ruxsat berish</Button>
                    )}
                </div>

                {isGranting || showGrantForm ? (
                    <div className="border p-4 rounded-md bg-gray-50">
                        <h3 className="font-medium mb-4">Yangi kurs ochish</h3>
                        <div className="grid grid-cols-1 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Kurs</label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={grantForm.courseId}
                                    onChange={(e) => setGrantForm({ ...grantForm, courseId: e.target.value })}
                                >
                                    <option value="">Tanlang</option>
                                    {allCourses.map(c => (
                                        <option key={c.id} value={c.id}>{getMultilangValue(c.name)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Tarif</label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={grantForm.tariffId}
                                    onChange={(e) => setGrantForm({ ...grantForm, tariffId: e.target.value })}
                                >
                                    <option value="">Tanlang</option>
                                    {/* Valid Tariffs Logic */}
                                    {
                                        (() => {
                                            if (!grantForm.courseId) return null;

                                            const selectedCourse = allCourses.find(c => c.id === grantForm.courseId);

                                            if (!selectedCourse || !selectedCourse.price || selectedCourse.price.length === 0) {
                                                return <option value="" disabled>Bu kurs uchun narx belgilanmagan</option>;
                                            }

                                            // Filter tariffs to only those with price options for this course
                                            // Both Tariff.duration and CoursePriceOption.duration are in MONTHS
                                            const validTariffs = allTariffs.filter(tariff => {
                                                const match = selectedCourse.price.some(priceOption => {
                                                    const tariffDuration = Number(tariff.duration);
                                                    const priceDuration = Number(priceOption.duration);
                                                    return tariffDuration === priceDuration;
                                                });
                                                return match;
                                            });

                                            if (validTariffs.length === 0) {
                                                return <option value="" disabled>Bu kurs uchun hech qanday tarif mavjud emas</option>;
                                            }

                                            return validTariffs.map(t => (
                                                <option key={t.id} value={t.id}>
                                                    {getMultilangValue(t.name)} ({t.duration} oy)
                                                </option>
                                            ));
                                        })()
                                    }
                                </select >
                                {
                                    grantForm.courseId && (() => {
                                        const selectedCourse = allCourses.find(c => c.id === grantForm.courseId);
                                        if (!selectedCourse || !selectedCourse.price || selectedCourse.price.length === 0) {
                                            return (
                                                <p className="text-xs text-amber-600 mt-1">
                                                    ⚠️ Iltimos, avval bu kurs uchun narx belgilang
                                                </p>
                                            );
                                        }
                                    })()
                                }
                            </div >
                        </div >
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>Bekor qilish</Button>
                            <Button
                                size="sm"
                                onClick={handleGrantAccess}
                                disabled={!grantForm.courseId || !grantForm.tariffId || isSaving}
                            >
                                {isSaving ? 'Saqlanmoqda...' : 'Saqlash'}
                            </Button>
                        </div>
                    </div >
                ) : (
                    <>
                        {loading ? (
                            <div className="text-center py-4">Yuklanmoqda...</div>
                        ) : (
                            <>
                                <div className="max-h-[400px] overflow-y-auto">
                                    <Table
                                        data={permissions}
                                        columns={columns}
                                        onDelete={handleDeletePermission}
                                    />
                                    {permissions.length === 0 && !loading && (
                                        <div className="text-center py-8 text-gray-500 text-sm">
                                            Hozircha kurslar yo'q
                                        </div>
                                    )}
                                </div>

                                {/* Pagination Controls */}
                                {permissions.length > 0 && (
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                        <div className="text-sm text-gray-600">
                                            Sahifa {currentPage} / {totalPages} (Jami: {total})
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handlePrevPage}
                                                disabled={!hasPrevious || currentPage === 1}
                                            >
                                                Oldingi
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleNextPage}
                                                disabled={!hasNext || currentPage >= totalPages}
                                            >
                                                Keyingi
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )
                }

                <div className="flex justify-end pt-2">
                    <Button variant="outline" onClick={onClose}>Yopish</Button>
                </div>
            </div >
        </Modal >
    );
}
