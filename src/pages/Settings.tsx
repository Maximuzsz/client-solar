import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Separator } from '@/components/ui/separator'
import userAPI, { NotificationSettings, DisplaySettings } from '@/services/userAPI'
import { Loader2 } from 'lucide-react'

export default function Settings() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: true,
    app: true,
    consumption: true,
    generation: true,
    billing: true,
  })
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    theme: 'system',
    chartStyle: 'bar',
    language: 'pt-BR',
  })
  
  // Carregar configurações do usuário ao montar o componente
  useEffect(() => {
    async function loadUserSettings() {
      try {
        setLoading(true)
        const settings = await userAPI.getUserSettings();
        
        if (settings.notifications) {
          setNotificationSettings(prev => ({
            ...prev,
            ...settings.notifications
          }));
        }
        
        if (settings.display) {
          setDisplaySettings(prev => ({
            ...prev,
            ...settings.display
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        toast({
          title: "Erro ao carregar configurações",
          description: "Não foi possível obter suas configurações. Tente novamente mais tarde.",
          variant: "destructive"
        });
      } finally {
        setLoading(false)
      }
    }
    
    loadUserSettings();
  }, [])

  const handleNotificationChange = (key: string) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }))
  }

  const handleDisplayChange = (key: string, value: string) => {
    setDisplaySettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true);
      await userAPI.updateUserSettings({
        notifications: notificationSettings,
        display: displaySettings
      });
      
      toast({
        title: "Configurações salvas",
        description: "Suas preferências foram atualizadas com sucesso."
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar suas configurações. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      {loading ? (
        <div className="flex items-center justify-center h-[70vh]">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Carregando configurações...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
            <p className="text-muted-foreground">
              Gerencie suas preferências e configurações da conta.
            </p>
          </div>
          
          <Tabs defaultValue="notifications" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="notifications">Notificações</TabsTrigger>
              <TabsTrigger value="display">Exibição</TabsTrigger>
              <TabsTrigger value="security">Segurança</TabsTrigger>
            </TabsList>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Notificações</CardTitle>
                <CardDescription>
                  Defina como e quando você deseja ser notificado sobre eventos da plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Notificações por e-mail</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba alertas e atualizações por e-mail.
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notificationSettings.email}
                      onCheckedChange={() => handleNotificationChange('email')}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="app-notifications">Notificações no aplicativo</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba alertas dentro da plataforma.
                      </p>
                    </div>
                    <Switch
                      id="app-notifications"
                      checked={notificationSettings.app}
                      onCheckedChange={() => handleNotificationChange('app')}
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <h3 className="mb-3 text-lg font-medium">Tipos de alertas</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="consumption-alerts">Alertas de consumo</Label>
                      <Switch
                        id="consumption-alerts"
                        checked={notificationSettings.consumption}
                        onCheckedChange={() => handleNotificationChange('consumption')}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="generation-alerts">Alertas de geração</Label>
                      <Switch
                        id="generation-alerts"
                        checked={notificationSettings.generation}
                        onCheckedChange={() => handleNotificationChange('generation')}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="billing-alerts">Alertas de faturamento</Label>
                      <Switch
                        id="billing-alerts"
                        checked={notificationSettings.billing}
                        onCheckedChange={() => handleNotificationChange('billing')}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="display">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Exibição</CardTitle>
                <CardDescription>
                  Personalize a aparência e o formato de exibição da plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Tema</Label>
                    <Select
                      value={displaySettings.theme}
                      onValueChange={(value) => handleDisplayChange('theme', value)}
                    >
                      <SelectTrigger id="theme">
                        <SelectValue placeholder="Selecione um tema" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Escuro</SelectItem>
                        <SelectItem value="system">Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="chart-style">Estilo dos gráficos</Label>
                    <Select
                      value={displaySettings.chartStyle}
                      onValueChange={(value) => handleDisplayChange('chartStyle', value)}
                    >
                      <SelectTrigger id="chart-style">
                        <SelectValue placeholder="Selecione um estilo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bar">Barras</SelectItem>
                        <SelectItem value="line">Linha</SelectItem>
                        <SelectItem value="area">Área</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select
                      value={displaySettings.language}
                      onValueChange={(value) => handleDisplayChange('language', value)}
                    >
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Selecione um idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="es-ES">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Segurança da Conta</CardTitle>
                <CardDescription>
                  Gerencie sua senha e configurações de segurança da conta.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Senha atual</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova senha</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                </div>
                
                <div className="pt-4 space-y-4">
                  <h3 className="text-lg font-medium">Verificação em duas etapas</h3>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="two-factor">Ativar verificação em duas etapas</Label>
                      <p className="text-sm text-muted-foreground">
                        Aumenta a segurança exigindo um código além da senha.
                      </p>
                    </div>
                    <Switch id="two-factor" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={loading || saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </div>
      )}
    </Layout>
  )
}