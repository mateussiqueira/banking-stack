# Modulo 3 — Sistemas Distribuidos para Fintechs
## Aula 10: Distributed Tracing, OpenTelemetry, and Metrics for Payment Pipelines

**Duracao:** 45 min  
**Nivel:** Avancado

### Objetivos
- Instrumentar pipelines de pagamento com OpenTelemetry
- Implementar distributed tracing para transacoes cross-service
- Definir metricas e alertas para sistemas financeiros

### Teoria

Observabilidade em sistemas de pagamento nao e opcional — e regulatoria. O Bacen exige que instituicoes registrem e monitorem toda a cadeia de liquidacao. Distributed tracing permite rastrear uma transacao PIX do inicio ao fim, atravessando dezenas de microservicos, e identificar onde a latencia ou erro ocorreu.

**OpenTelemetry (OTel)** e o padrao CNCF para tracing, metrics e logging. Ele define tres pilares:
- **Traces:** Representam o caminho completo de uma requisicao como arvore de spans
- **Metrics:** Dados numericos agregados (contadores, histogramas, gauges)
- **Logs:** Eventos textuais vinculados a traces via trace ID

```go
func initTracer() (*sdktrace.TracerProvider, error) {
    exporter, err := otlptracehttp.New(ctx,
        otlptracehttp.WithEndpoint("otel-collector:4318"),
        otlptracehttp.WithInsecure(),
    )
    if err != nil {
        return nil, err
    }

    tp := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(exporter),
        sdktrace.WithResource(resource.NewWithAttributes(
            semconv.ServiceNameKey.String("payment-processor"),
            semconv.ServiceVersionKey.String("1.0.0"),
        )),
    )
    otel.SetTracerProvider(tp)
    return tp, nil
}
```

**Spans aninhados em pagamentos:** Cada etapa do pipeline vira um span:

```go
func ProcessPIXPayment(ctx context.Context, payment PIXRequest) error {
    tracer := otel.Tracer("payment-processor")
    ctx, rootSpan := tracer.Start(ctx, "PIX.Process",
        trace.WithAttributes(
            attribute.String("pix.id", payment.ID),
            attribute.Float64("pix.amount", float64(payment.Amount)/100),
        ))
    defer rootSpan.End()

    // Span: Validacao antifraude
    ctx, fraudSpan := tracer.Start(ctx, "PIX.FraudCheck")
    err := fraudService.Check(ctx, payment)
    fraudSpan.End()
    if err != nil {
        rootSpan.SetStatus(codes.Error, "fraud check failed")
        rootSpan.RecordError(err)
        return err
    }

    // Span: Liquidacao SPI
    ctx, spiSpan := tracer.Start(ctx, "PIX.SPISettlement")
    err = spiClient.Settle(ctx, payment)
    spiSpan.SetAttributes(attribute.Int64("spi.status_code", int64(200)))
    spiSpan.End()
    if err != nil {
        rootSpan.RecordError(err)
        return err
    }

    rootSpan.SetStatus(codes.Ok, "payment settled")
    return nil
}
```

**Metricas de negocio para pagamentos:**

```go
// OpenTelemetry metrics
var (
    paymentCounter, _ = meter.Int64Counter(
        "payment.processed.total",
        metric.WithDescription("Total de pagamentos processados"),
    )

    paymentLatency, _ = meter.Int64Histogram(
        "payment.latency.ms",
        metric.WithDescription("Latencia de processamento de pagamento"),
    )

    paymentValue, _ = meter.Int64Counter(
        "payment.value.total",
        metric.WithDescription("Volume financeiro total processado"),
    )
)

func RecordPaymentMetrics(ctx context.Context, payment PIXRequest, duration time.Duration) {
    paymentCounter.Add(ctx, 1,
        attribute.String("status", payment.Status),
        attribute.String("pix_type", payment.Type),
    )
    paymentLatency.Record(ctx, duration.Milliseconds())
    paymentValue.Add(ctx, payment.Amount,
        attribute.String("currency", "BRL"),
    )
}
```

**Alertas essenciais para fintechs:**
- Taxa de erro > 0.1% nos ultimos 5 minutos → alerta critico (P1)
- Latencia P99 > 3 segundos na liquidacao SPI → investigar
- Volume financeiro processado cai > 20% vs mesma hora dia anterior → possivel outage
- Dead letter queue cresce > 50 mensagens → reconciliacao necessaria

**Trace context propagation via Kafka:** Headers Kafka carregam o `traceparent` (W3C Trace Context), permitindo que producers e consumers compartilhem o mesmo trace:

```go
// Producer injeta trace context nos headers Kafka
func PublishWithTraceContext(ctx context.Context, msg *sarama.ProducerMessage) {
    propagator := propagation.TraceContext{}
    carrier := propagation.MapCarrier{}
    propagator.Inject(ctx, carrier)

    for k, v := range carrier {
        msg.Headers = append(msg.Headers, sarama.RecordHeader{
            Key:   []byte(k),
            Value: []byte(v),
        })
    }
}
```

### Exercicio

Implemente instrumentacao completa de um pipeline PIX com OpenTelemetry: (1) inicie tracer/collector OTLP exportando para Jaeger, (2) crie spans aninhados `PIX.Receive`, `PIX.Validate`, `PIX.Settle`, `PIX.Notify`, (3) adicione metricas `payment.processed.total`, `payment.latency.p99`, `payment.error_rate`, (4) propague trace context via Kafka entre producer e consumer. Visualize o trace no Jaeger UI e confirme que toda a cadeia e rastreada.

### Proximo
Continue para o modulo de seguranca e compliance.
