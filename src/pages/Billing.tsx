import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'wouter'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Layout } from '@/components/layout/Layout'
import { 
  CreditCard, 
  Package, 
  Check, 
  Clock, 
  CalendarDays,
  Banknote, 
  ArrowRight,
  Sparkles
} from 'lucide-react'

// Importando as funções e interfaces da API de pagamento
import { 
  getCurrentSubscription, 
  getPaymentHistory,
  type CurrentSubscription, 
  type PaymentHistory
} from '@/lib/payment'

export default function Billing() {
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [, setLocation] = useLocation()

  // Consulta para obter dados da assinatura atual
  const { data: subscription, isLoading: loadingSubscription } = useQuery({
    queryKey: ['/api/v1/payments/current-subscription'],
    queryFn: getCurrentSubscription
  })

  // Consulta para obter histórico de pagamentos
  const { data: paymentHistory, isLoading: loadingPaymentHistory } = useQuery({
    queryKey: ['/api/v1/payments/payment-history'],
    queryFn: getPaymentHistory
  })

  // Determina se está carregando
  const isLoading = loadingSubscription || loadingPaymentHistory

  // Formatador de data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date)
  }

  // Formatador de moeda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Faturamento</h1>
          <p className="text-muted-foreground">
            Gerencie sua assinatura, métodos de pagamento e faturas
          </p>
        </div>

        {/* Seção de Assinatura */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Assinatura Atual</h2>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{subscription?.plan.name || 'Plano Básico'}</CardTitle>
                  <CardDescription>
                    {subscription?.active ? 'Assinatura ativa' : 'Assinatura inativa'}
                  </CardDescription>
                </div>
                <span className="text-2xl font-bold">
                  {formatCurrency(subscription?.plan.price || 0)}/mês
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start space-x-3">
                    <CalendarDays className="mt-1 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Próxima fatura</p>
                      <p className="text-sm text-muted-foreground">
                        {subscription?.nextBillingDate
                          ? formatDate(subscription.nextBillingDate)
                          : 'Não disponível'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="mt-1 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Status</p>
                      <p className="text-sm text-muted-foreground">
                        {subscription?.active 
                          ? 'Ativa' 
                          : 'Inativa'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="font-medium">Recursos incluídos:</p>
                  <ul className="space-y-2">
                    {subscription?.features?.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="mr-2 h-5 w-5 text-green-500" />
                        <span>{feature.name}: {feature.limit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col space-y-2 pt-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                  <Button 
                    variant="default"
                    onClick={() => setLocation('/plans')}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Ver todos os planos
                  </Button>
                  {subscription?.active && (
                    <Button 
                      variant="outline" 
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setShowCancelModal(true)}
                    >
                      Cancelar assinatura
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Métodos de Pagamento */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Métodos de Pagamento</h2>
            <Button variant="outline" size="sm">
              <CreditCard className="mr-2 h-4 w-4" />
              Adicionar cartão
            </Button>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <CreditCard className="mb-2 h-10 w-10 text-muted-foreground" />
                <p className="text-center font-medium">Nenhum método de pagamento cadastrado</p>
                <p className="text-sm text-muted-foreground text-center my-2">
                  Adicione um cartão de crédito para configurar pagamentos automáticos para sua assinatura
                </p>
                <Button className="mt-4" variant="outline">
                  Adicionar cartão de crédito
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Seção de Faturas */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Histórico de Pagamentos</h2>

          <Card>
            <CardContent className="p-0">
              {paymentHistory && paymentHistory.length > 0 ? (
                <div className="divide-y">
                  {paymentHistory.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-4">
                        <div className={`rounded-full p-2 ${
                          payment.status === 'Pago' 
                            ? 'bg-green-100 text-green-700' 
                            : payment.status === 'Pendente' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-red-100 text-red-700'
                        }`}>
                          <Banknote className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {payment.planName} - {formatDate(payment.date)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {payment.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-medium">
                          {formatCurrency(payment.value)}
                        </span>
                        {payment.invoiceId && (
                          <a 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              alert('Fatura não disponível');
                            }}
                            className="flex items-center text-primary hover:underline"
                          >
                            Ver <ArrowRight className="ml-1 h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <Package className="mb-2 h-10 w-10 text-muted-foreground" />
                  <p>Nenhum pagamento encontrado</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Os pagamentos aparecerão aqui quando sua assinatura for processada
                  </p>
                  <Button 
                    onClick={() => setLocation('/plans')}
                    variant="outline"
                    className="mt-2"
                  >
                    Assinar um plano
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}