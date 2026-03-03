'use client';

import { useState, useEffect } from 'react';
import { AppConfig } from '@/types';
import { appRouteService } from '@/services/app-route.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

export default function AppConfigPage() {
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const defaultConfig: AppConfig = {
        id: '',
        call_center: '',
        support_url: '',
        app_version: { android: '', ios: '' },
        app_links: { google: '', apple: '' },
        payment_min_version: '',
        buy_course: true,
        created_at: '',
        updated_at: ''
    };

    const TARGET_ID = 'd2e411c5-6b4d-4903-8f7d-e437bcb0bb76';

    const loadConfig = async () => {
        try {
            setLoading(true);
            const response = await appRouteService.getAll();
            console.log('App Route Response:', response);

            const { app_routes } = response;

            // Try to find the specific target ID first
            let data = app_routes?.find(r => r.id === TARGET_ID);

            // Fallback to the first one if target not found
            if (!data && app_routes?.length > 0) {
                console.warn(`Target app route ${TARGET_ID} not found, falling back to first available.`);
                data = app_routes[0];
            }

            if (data) {
                console.log('Found App Route Data:', data);
                // Deep merge or at least ensure top level objects exist
                const mergedConfig = {
                    ...defaultConfig,
                    ...data,
                    app_version: { ...defaultConfig.app_version, ...data?.app_version },
                    app_links: { ...defaultConfig.app_links, ...data?.app_links },
                };
                setConfig(mergedConfig);
            } else {
                console.warn('No app route data found in list');
                setConfig(defaultConfig);
            }
        } catch (error: any) {
            console.error('Failed to load app config:', error);
            toast.error('Ilova sozlamalarini yuklashda xatolik');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!config || !config.id) {
            toast.error('O\'zgartirish uchun sozlama topilmadi');
            return;
        }

        try {
            setSaving(true);
            // Omit read-only fields for the update
            const { id, created_at, updated_at, ...updateData } = config;
            await appRouteService.update(id, updateData);
            toast.success('Sozlamalar muvaffaqiyatli saqlandi');
            loadConfig();
        } catch (error: any) {
            console.error('Failed to save app config:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Sozlamalarni saqlashda xatolik';
            toast.error(`Xatolik: ${errorMessage}`);
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (path: string, value: any) => {
        if (!config) return;

        setConfig(prev => {
            if (!prev) return null;
            const newConfig = JSON.parse(JSON.stringify(prev)); // Deep clone simple object
            const keys = path.split('.');
            let current: any = newConfig;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {}; // Initialize if missing
                }
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newConfig;
        });
    };

    if (loading) {
        return <div className="text-center py-8 text-muted-foreground">Sozlamalar yuklanmoqda...</div>;
    }

    if (!config) {
        return <div className="text-center py-8 text-destructive">Sozlamalarni yuklashda xatolik.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Ilova Sozlamalari</h1>
                <Button onClick={handleSubmit} disabled={saving}>
                    {saving ? 'Saqlanmoqda...' : 'O\'zgarishlarni saqlash'}
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Aloqa va Yordam</CardTitle>
                        <CardDescription>Rasmiy aloqa ma'lumotlari va yordam kanallari.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            label="Call Markaz"
                            value={config.call_center ?? ''}
                            onChange={(e) => handleChange('call_center', e.target.value)}
                            placeholder="+998901234567"
                            required
                        />
                        <Input
                            label="Yordam URL (Telegram)"
                            value={config.support_url ?? ''}
                            onChange={(e) => handleChange('support_url', e.target.value)}
                            placeholder="https://t.me/support"
                            required
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Ilova Versiyalari va To'lovlar</CardTitle>
                        <CardDescription>Minimal versiyalar va to'lovlarni boshqarish.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Android Versiya"
                                value={config.app_version?.android ?? ''}
                                onChange={(e) => handleChange('app_version.android', e.target.value)}
                                placeholder="1.0.0"
                                required
                            />
                            <Input
                                label="iOS Versiya"
                                value={config.app_version?.ios ?? ''}
                                onChange={(e) => handleChange('app_version.ios', e.target.value)}
                                placeholder="1.0.0"
                                required
                            />
                        </div>
                        <Input
                            label="Minimal To'lov Versiyasi"
                            value={config.payment_min_version ?? ''}
                            onChange={(e) => handleChange('payment_min_version', e.target.value)}
                            placeholder="1.0.0"
                            required
                        />
                        <div className="flex items-center justify-between p-3 border rounded-md bg-white">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium">Kurslarni sotib olish</label>
                                <p className="text-xs text-muted-foreground">
                                    Ilovada barcha kurslar uchun to'lovni yoqish yoki o'chirish.
                                </p>
                            </div>
                            <Switch
                                checked={config.buy_course ?? false}
                                onCheckedChange={(checked) => handleChange('buy_course', checked)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Yuklab olish havolalari</CardTitle>
                        <CardDescription>Foydalanuvchilar uchun ilova do'konlariga havolalar.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Google Play Store Havolasi"
                            value={config.app_links?.google ?? ''}
                            onChange={(e) => handleChange('app_links.google', e.target.value)}
                            placeholder="https://play.google.com/..."
                            required
                        />
                        <Input
                            label="Apple App Store Havolasi"
                            value={config.app_links?.apple ?? ''}
                            onChange={(e) => handleChange('app_links.apple', e.target.value)}
                            placeholder="https://apps.apple.com/..."
                            required
                        />
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
