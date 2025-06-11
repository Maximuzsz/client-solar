import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'

export default function Profile() {
  const { toast } = useToast()
  const { user } = useAuth()
  
  // Formatar nome completo a partir de firstName e lastName se name não existir
  const fullName = user?.name || 
    (user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || user?.username || '');
      
  const [formData, setFormData] = useState({
    name: fullName,
    email: user?.email || '',
    username: user?.username || '',
    phone: '', 
    address: '',
    city: '',
    state: '',
    postalCode: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    toast({
      title: "Perfil atualizado",
      description: "Suas informações foram atualizadas com sucesso."
    })
  }

  // Função para gerar iniciais do usuário
  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e preferências de conta.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[250px_1fr]">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Seu Perfil</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src="" alt={fullName || 'Avatar do usuário'} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="text-lg font-semibold">{fullName}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Função:</p>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {user?.role === 'NetworkOwner' ? 'Proprietário de Rede' :
                   user?.role === 'Consumer' ? 'Consumidor' :
                   user?.role === 'Generator' ? 'Gerador' : 
                   user?.role === 'Admin' ? 'Administrador' : 'Usuário'}
                </span>
              </div>
              <Button variant="outline" className="w-full">Alterar foto</Button>
            </CardContent>
          </Card>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="payment">Pagamento</TabsTrigger>
              <TabsTrigger value="activity">Atividade</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>
                    Atualize suas informações pessoais.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Nome de usuário</Label>
                      <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="mb-4 text-lg font-medium">Endereço</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="address">Endereço</Label>
                        <Input
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">Estado</Label>
                        <Input
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">CEP</Label>
                        <Input
                          id="postalCode"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={handleSave}>Salvar alterações</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="payment">
              <Card>
                <CardHeader>
                  <CardTitle>Informações de Pagamento</CardTitle>
                  <CardDescription>
                    Gerencie seus métodos de pagamento e histórico de faturas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="mb-4 text-lg font-medium">Métodos de Pagamento</h3>
                    <div className="rounded-md border p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-16 items-center justify-center rounded-md border bg-muted">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                            <line x1="1" y1="10" x2="23" y2="10" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Cartão de crédito ****4242</p>
                          <p className="text-xs text-muted-foreground">Expira em 12/2025</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">Editar</Button>
                        <Button variant="ghost" size="sm">Remover</Button>
                      </div>
                    </div>
                    <Button variant="outline" className="mt-4">
                      Adicionar método de pagamento
                    </Button>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="mb-4 text-lg font-medium">Histórico de Faturamento</h3>
                    <div className="rounded-md border">
                      <div className="grid grid-cols-3 p-3 text-sm font-medium border-b">
                        <div>Data</div>
                        <div>Descrição</div>
                        <div className="text-right">Valor</div>
                      </div>
                      <div className="grid grid-cols-3 p-3 text-sm border-b">
                        <div>10/05/2025</div>
                        <div>Assinatura Mensal</div>
                        <div className="text-right">R$ 79,90</div>
                      </div>
                      <div className="grid grid-cols-3 p-3 text-sm border-b">
                        <div>10/04/2025</div>
                        <div>Assinatura Mensal</div>
                        <div className="text-right">R$ 79,90</div>
                      </div>
                      <div className="grid grid-cols-3 p-3 text-sm">
                        <div>10/03/2025</div>
                        <div>Assinatura Mensal</div>
                        <div className="text-right">R$ 79,90</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Atividade Recente</CardTitle>
                  <CardDescription>
                    Visualize as atividades recentes da sua conta.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Atualização de perfil</p>
                        <p className="text-xs text-muted-foreground">Você atualizou suas informações de perfil.</p>
                        <p className="text-xs text-muted-foreground">11 de maio, 2025 - 12:34</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Pagamento processado</p>
                        <p className="text-xs text-muted-foreground">Seu pagamento mensal foi processado com sucesso.</p>
                        <p className="text-xs text-muted-foreground">10 de maio, 2025 - 00:00</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
                          <path d="M18 9V5a2 2 0 0 0-2-2h-3" />
                          <path d="m4 12 8 1 9-9" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Relatório gerado</p>
                        <p className="text-xs text-muted-foreground">Você gerou um novo relatório de consumo mensal.</p>
                        <p className="text-xs text-muted-foreground">5 de maio, 2025 - 15:27</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Login realizado</p>
                        <p className="text-xs text-muted-foreground">Novo login na sua conta.</p>
                        <p className="text-xs text-muted-foreground">1 de maio, 2025 - 09:12</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  )
}