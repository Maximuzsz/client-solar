import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { apiRequest } from '@/lib/api'
import { useLocation } from 'wouter'

// Schema de validação do formulário
const formSchema = z.object({
  paymentType: z.enum(['pix', 'creditCard', 'bankTransfer', 'other'], {
    required_error: 'Selecione o tipo de pagamento',
  }),
  amount: z.string()
    .min(1, 'Informe o valor pago')
    .refine((val) => !isNaN(parseFloat(val)), 'Informe um valor numérico válido')
    .refine((val) => parseFloat(val) > 0, 'O valor deve ser maior que zero'),
  paymentDate: z.string().min(1, 'Informe a data de pagamento'),
  transactionId: z.string().optional(),
  description: z.string().optional(),
  reportType: z.enum(['planSubscription', 'reportPayment', 'other'], {
    required_error: 'Selecione o tipo de relatório',
  }),
  attachmentUrl: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function ReportPayment() {
  const { toast } = useToast()
  const [, setLocation] = useLocation()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentType: 'pix',
      amount: '',
      paymentDate: new Date().toISOString().slice(0, 10),
      transactionId: '',
      description: '',
      reportType: 'planSubscription',
      attachmentUrl: '',
    },
  })
  
  const onSubmit = async (data: FormValues) => {
    try {
      // Converter o valor para número
      const formattedData = {
        ...data,
        amount: parseFloat(data.amount),
      }
      
      await apiRequest('POST', '/api/report-payment', formattedData)
      
      toast({
        title: 'Pagamento reportado com sucesso',
        description: 'Recebemos seu relato de pagamento e iremos verificá-lo em breve.',
      })
      
      // Redirecionar para a página de faturamento
      setLocation('/billing')
    } catch (error) {
      console.error('Erro ao reportar pagamento:', error)
      toast({
        title: 'Erro ao reportar pagamento',
        description: 'Não foi possível processar seu relato. Por favor, tente novamente.',
        variant: 'destructive',
      })
    }
  }
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      setIsUploading(true)
      // Na implementação real, faríamos upload para um servidor
      // Aqui simulamos o comportamento
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // No mundo real, essa URL viria do servidor após o upload
      const fakeAttachmentUrl = `https://storage.example.com/uploads/${Date.now()}_${file.name}`
      form.setValue('attachmentUrl', fakeAttachmentUrl)
      setUploadedFileName(file.name)
      
      toast({
        title: 'Comprovante enviado',
        description: 'Seu comprovante foi enviado com sucesso.',
      })
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível enviar o arquivo. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl font-bold">Reportar Pagamento</h1>
          <p className="text-muted-foreground">
            Informe detalhes do pagamento realizado para agilizar a confirmação.
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Pagamento</CardTitle>
            <CardDescription>
              Preencha as informações sobre o pagamento que você realizou
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="reportType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipo de Pagamento</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="planSubscription" id="planSubscription" />
                            <Label htmlFor="planSubscription">Assinatura de Plano</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="reportPayment" id="reportPayment" />
                            <Label htmlFor="reportPayment">Pagamento de Relatório</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="other" id="otherReport" />
                            <Label htmlFor="otherReport">Outro</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Pagamento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o método de pagamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="creditCard">Cartão de Crédito</SelectItem>
                          <SelectItem value="bankTransfer">Transferência Bancária</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0,00" {...field} />
                        </FormControl>
                        <FormDescription>
                          Informe o valor exato pago
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data do Pagamento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="transactionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID da Transação (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: PIX123456" {...field} />
                      </FormControl>
                      <FormDescription>
                        Código, número ou identificador da transação, se disponível
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição ou Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Forneça detalhes adicionais sobre o pagamento, se necessário" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="attachmentUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comprovante de Pagamento</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('file-upload')?.click()}
                            disabled={isUploading}
                          >
                            {isUploading ? 'Enviando...' : 'Carregar comprovante'}
                          </Button>
                          <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            accept="image/png,image/jpeg,image/jpg,application/pdf"
                            onChange={(event) => {
                              field.onChange(event)
                              handleFileChange(event)
                            }}
                            ref={field.ref}
                          />
                          {uploadedFileName && (
                            <span className="text-sm text-muted-foreground">
                              {uploadedFileName}
                            </span>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Envie um comprovante em PNG, JPG ou PDF (máx. 5MB)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Enviando...' : 'Enviar relatório de pagamento'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Após o envio, nossa equipe analisará as informações e atualizará o status da sua conta em até 24 horas úteis.
            </p>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  )
}