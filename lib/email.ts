import { Resend } from "resend"

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}


interface SendEmailOptions {
  subject: string
  html: string
  text: string
}

async function sendEmail({ subject, html, text }: SendEmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[email-dev] Would send:", { subject, to: process.env.EMAIL_TO || "2acivelcariacica@gmail.com" })
    console.log("[email-dev] Text preview:", text.slice(0, 200))
    return true
  }
  try {
    const emailFrom = process.env.EMAIL_FROM || "noreply@2avaraciveldecariacica.org"
    const emailTo = process.env.EMAIL_TO || "2acivelcariacica@gmail.com"
    await getResend().emails.send({
      from: `2ª Vara Cível de Cariacica <${emailFrom}>`,
      to: emailTo,
      subject,
      html,
      text,
    })
    return true
  } catch (error) {
    console.error("Email send error:", error)
    return false
  }
}

export async function sendContactNotification(contact: {
  name: string
  phone: string
  email: string
  subject: string
  message: string
}) {
  const text = `Nova mensagem de contato:\n\nNome: ${contact.name}\nTelefone: ${contact.phone}\nEmail: ${contact.email}\nAssunto: ${contact.subject}\n\nMensagem:\n${contact.message}\n\n---\nEnviado via Portal da 2ª Vara Cível de Cariacica`

  const html = `
    <h2>Nova Mensagem de Contato</h2>
    <table>
      <tr><td><strong>Nome:</strong></td><td>${contact.name}</td></tr>
      <tr><td><strong>Telefone:</strong></td><td>${contact.phone}</td></tr>
      <tr><td><strong>Email:</strong></td><td>${contact.email}</td></tr>
      <tr><td><strong>Assunto:</strong></td><td>${contact.subject}</td></tr>
    </table>
    <h3>Mensagem:</h3>
    <p>${contact.message.replace(/\n/g, "<br>")}</p>
    <hr>
    <small>Enviado via Portal da 2ª Vara Cível de Cariacica</small>
  `

  return sendEmail({
    subject: `Novo Contato: ${contact.subject}`,
    html,
    text,
  })
}

export async function sendAppointmentNotification(appointment: {
  type: string
  withWhom: string
  name: string
  oabNumber?: string
  processNumber: string
  reason: string
}) {
  const typeLabel = appointment.type === "presencial" ? "Presencial" : "Virtual (Zoom)"
  const withWhomLabel = appointment.withWhom === "juiz" ? "Juiz" : "Assessoria"

  const text = `Novo agendamento:\n\nTipo: ${typeLabel}\nCom quem: ${withWhomLabel}\nNome: ${appointment.name}\n${appointment.oabNumber ? `OAB: ${appointment.oabNumber}\n` : ""}Processo: ${appointment.processNumber}\n\nMotivo:\n${appointment.reason}\n\n---\nAcesse o painel administrativo para confirmar.`

  const html = `
    <h2>Novo Agendamento Solicitado</h2>
    <table>
      <tr><td><strong>Tipo:</strong></td><td>${typeLabel}</td></tr>
      <tr><td><strong>Com quem:</strong></td><td>${withWhomLabel}</td></tr>
      <tr><td><strong>Nome:</strong></td><td>${appointment.name}</td></tr>
      ${appointment.oabNumber ? `<tr><td><strong>OAB:</strong></td><td>${appointment.oabNumber}</td></tr>` : ""}
      <tr><td><strong>Processo:</strong></td><td>${appointment.processNumber}</td></tr>
    </table>
    <h3>Motivo:</h3>
    <p>${appointment.reason.replace(/\n/g, "<br>")}</p>
    <hr>
    <small>Acesse o painel administrativo para confirmar o agendamento.</small>
  `

  return sendEmail({
    subject: `Novo Agendamento: ${appointment.name} - ${typeLabel}`,
    html,
    text,
  })
}

export async function sendDemandNotification(demand: {
  processNumber: string
  demandType: string
  description: string
  priority: string
}) {
  const typeLabels: Record<string, string> = {
    reclamacao: "Reclamação",
    celeridade: "Pedido de Celeridade",
    peticao_urgente: "Petição Urgente",
  }
  const typeLabel = typeLabels[demand.demandType] || demand.demandType
  const priorityEmoji = demand.priority === "urgent" ? "🔴" : demand.priority === "high" ? "🟠" : "🟢"

  const text = `${priorityEmoji} Nova demanda:\n\nTipo: ${typeLabel}\nProcesso: ${demand.processNumber}\nPrioridade: ${demand.priority}\n\nDescrição:\n${demand.description}\n\n---\nAcesse o painel administrativo para analisar.`

  const html = `
    <h2>${priorityEmoji} Nova Demanda Registrada</h2>
    <table>
      <tr><td><strong>Tipo:</strong></td><td>${typeLabel}</td></tr>
      <tr><td><strong>Processo:</strong></td><td>${demand.processNumber}</td></tr>
      <tr><td><strong>Prioridade:</strong></td><td>${demand.priority}</td></tr>
    </table>
    <h3>Descrição:</h3>
    <p>${demand.description.replace(/\n/g, "<br>")}</p>
    <hr>
    <small>Acesse o painel administrativo para analisar a demanda.</small>
  `

  return sendEmail({
    subject: `${priorityEmoji} Nova Demanda: ${typeLabel} - Processo ${demand.processNumber}`,
    html,
    text,
  })
}
