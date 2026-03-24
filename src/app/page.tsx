// app/page.tsx
"use client";

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { useSession, signIn, signOut } from 'next-auth/react';

// 1. Tipagem: Definindo o formato dos dados que vêm da sua API
interface Agendamento {
  id: string; // ou number, dependendo do seu schema do Prisma
  title: string;
  startTime: string; // O Prisma envia datas como string ISO
  endTime: string;
  organizerEmail: string;
  room?: {
    name: string;
  }
  // user: { name: string }; // Descomente se quiser puxar o nome do usuário da relação
}
interface Sala {
  id: string;
  name: string
}

const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function AgendamentosPage() {
  const [viewMode, setViewMode] = useState<'lista' | 'calendario'>('calendario');
  
  // 2. Novos Estados para a API
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  // 3. Estados para MODAL
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    data: '',
    horaInicio: '',
    horaFim: '',
    roomId: '',
    organizador: '',
    convidados: '',
  });
  const [salas, setSalas] = useState<Sala[]>([]);

  const { data: session, status } = useSession();
  const [emailLogin, setEmailLogin] = useState('');
  const [linkEnviado, setLinkEnviado] = useState(false);

  // Estados do Calendário
  const hoje = new Date();
  const [dataAtual, setDataAtual] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [diaSelecionado, setDiaSelecionado] = useState(hoje.getDate());

  // Lógica do Calendário
  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const primeiroDiaDoMes = new Date(ano, mes, 1).getDay();
  const diasVazios = Array.from({ length: primeiroDiaDoMes }, (_, i) => i);
  const dias = Array.from({ length: diasNoMes }, (_, i) => i + 1);
  const mesPorExtenso = dataAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const mesAnterior = () => setDataAtual(new Date(ano, mes - 1, 1));
  const proximoMes = () => setDataAtual(new Date(ano, mes + 1, 1));

  // 3. O Fetch: Buscando dados da sua API real
  useEffect(() => {
    async function carregarDados() {
      try {
        // Busca Agendamentos
        const resAgendamentos = await fetch('/api/bookings'); 
        if (!resAgendamentos.ok) throw new Error('Falha ao buscar agendamentos');
        setAgendamentos(await resAgendamentos.json());

        // Busca Salas (Ajuste a URL '/api/rooms' se a sua for diferente)
        const resSalas = await fetch('/api/rooms');
        if (resSalas.ok) {
          const dataSalas = await resSalas.json();
          setSalas(dataSalas);
          
          // Já deixa a primeira sala selecionada por padrão no formulário
          if (dataSalas.length > 0) {
            setFormData(prev => ({ ...prev, roomId: dataSalas[0].id }));
          }
        }
      } catch (err) {
        setErro('Não foi possível carregar os dados.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, []);

// 2. TELAS DE CARREGAMENTO E LOGIN
  if (status === 'loading') {
    return <main className={styles.container}><div className={styles.placeholderCard}>Carregando sistema...</div></main>;
  }

  if (status === 'unauthenticated') {
    return (
      <main className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className={styles.modalContent} style={{ textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <h2 className={styles.modalTitle}>Acesso Corporativo</h2>
          <p style={{ marginBottom: '24px', color: '#6b7280', fontSize: '0.875rem' }}>
            Digite seu e-mail para receber o link mágico de acesso à agenda de salas.
          </p>
          
          {linkEnviado ? (
            <div style={{ color: '#059669', fontWeight: 'bold', padding: '16px', backgroundColor: '#d1fae5', borderRadius: '8px' }}>
              ✓ Link seguro enviado! Verifique sua caixa de entrada (e a pasta de spam).
            </div>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault();
              // Isso chama o NextAuth nos bastidores pelo método correto (POST)
              await signIn('email', { email: emailLogin, redirect: false });
              setLinkEnviado(true);
            }}>
              <input 
                type="email" 
                className={styles.input} 
                placeholder="voce@empresa.com" 
                value={emailLogin}
                onChange={(e) => setEmailLogin(e.target.value)}
                required
                style={{ width: '100%', marginBottom: '16px' }}
              />
              <button type="submit" className={styles.btnPrimary} style={{ width: '100%' }}>
                Receber Link Seguro
              </button>
            </form>
          )}
        </div>
      </main>
    );
  }

  // 4. Funções auxiliares para formatar os dados na tela
  const formatarHorario = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const verificarSeTemAgendamento = (dia: number) => {
    // Verifica se existe algum agendamento no ano, mês e dia que estão sendo renderizados
    return agendamentos.some(ag => {
      const dataAgendamento = new Date(ag.startTime);
      return (
        dataAgendamento.getDate() === dia &&
        dataAgendamento.getMonth() === mes &&
        dataAgendamento.getFullYear() === ano
      );
    });
  };

  // NOVA LÓGICA: Filtra os agendamentos apenas para o dia, mês e ano selecionados no calendário
  const agendamentosDoDiaSelecionado = agendamentos.filter(ag => {
    const dataAgendamento = new Date(ag.startTime);
    return (
      dataAgendamento.getDate() === diaSelecionado &&
      dataAgendamento.getMonth() === mes && // 'mes' e 'ano' vêm do estado dataAtual
      dataAgendamento.getFullYear() === ano
    );
  });

  // Função para passar da Etapa 1 para a Etapa 2
  const handleAvancar = (e: React.FormEvent) => {
    e.preventDefault(); // Impede o envio do form ainda
    setModalStep(2);
  };

  // Sua função de envio final atualizada
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const start = new Date(`${formData.data}T${formData.horaInicio}:00`).toISOString();
      const end = new Date(`${formData.data}T${formData.horaFim}:00`).toISOString();

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          startTime: start,
          endTime: end,
          roomId: formData.roomId,
          organizerEmail: session?.user?.email,
          participantsEmails: formData.convidados,  // <- ENVIANDO PARA API
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao agendar reunião');
      }

      const novoAgendamento = await response.json();
      setAgendamentos((prev) => [...prev, novoAgendamento]);
      
      // Limpeza total
      setIsModalOpen(false);
      setModalStep(1); // Volta o modal para a etapa 1 para a próxima vez
      setFormData({ 
        title: '', data: '', horaInicio: '', horaFim: '', roomId: salas.length > 0 ? salas[0].id : '',
        organizador: '', convidados: '' // Limpa os e-mails
      });
      alert('Reunião agendada com sucesso!');

    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // FUNÇÃO PARA CANCELAR AGENDAMENTO
  const handleExcluir = async (id: string) => {
    // Uma pequena confirmação para evitar toques acidentais no telemóvel
    if (!window.confirm('Tem a certeza que deseja cancelar este agendamento?')) return;

    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao cancelar agendamento');
      }

      // Atualiza a lista no ecrã imediatamente, removendo o cartão apagado
      setAgendamentos((prev) => prev.filter((ag) => ag.id !== id));
      
      // Opcional: Se quiser recarregar também a verificação do calendário
      // a lógica atual já lida com isso assim que o estado 'agendamentos' muda!

    } catch (error) {
      alert('Não foi possível cancelar o agendamento.');
      console.error(error);
    }
  };
// --- LÓGICA DA VISÃO SEMANAL (AGENDA) ---
  
  // 1. Criamos a data completa juntando o Ano e Mês do calendário com o Dia clicado
  const dataCompletaSelecionada = new Date(ano, mes, diaSelecionado);

  const inicioDaSemana = new Date(dataCompletaSelecionada);
  inicioDaSemana.setDate(dataCompletaSelecionada.getDate() - dataCompletaSelecionada.getDay()); // Volta para o Domingo
  inicioDaSemana.setHours(0, 0, 0, 0);

  const fimDaSemana = new Date(inicioDaSemana);
  fimDaSemana.setDate(fimDaSemana.getDate() + 6); // Avança para o Sábado
  fimDaSemana.setHours(23, 59, 59, 999);

  // Cria um array com os 7 dias exatos desta semana
  const diasDaSemanaAtual = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(inicioDaSemana);
    d.setDate(d.getDate() + i);
    return d;
  });

  // 2. Arrumamos as setinhas de navegação para andarem 7 dias e atualizarem o calendário
  const irParaSemanaAnterior = () => {
    const novaData = new Date(ano, mes, diaSelecionado - 7);
    setDataAtual(novaData); // Atualiza o calendário (caso mude de mês)
    setDiaSelecionado(novaData.getDate()); // Mantém o diaSelecionado como número!
  };

  const irParaProximaSemana = () => {
    const novaData = new Date(ano, mes, diaSelecionado + 7);
    setDataAtual(novaData);
    setDiaSelecionado(novaData.getDate());
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Agendamentos</h1>
      </header>

      {/* BOTÃO FLUTUANTE (FAB) */}
      <button 
        className={styles.fabButton} 
        onClick={() => setIsModalOpen(true)}
      >
        +
      </button>

      {/* O MODAL DE NOVO AGENDAMENTO */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>{modalStep === 1 ? 'Nova Reunião' : 'Identificação'}</h2>
            
            {modalStep === 1 ? (
              /* --- ETAPA 1: DADOS DA REUNIÃO --- */
              <form onSubmit={handleAvancar}>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Motivo da Reunião</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    placeholder="Ex: Alinhamento Semanal"
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                    required 
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Data</label>
                  <input 
                    type="date" 
                    className={styles.input} 
                    value={formData.data}
                    onChange={(e) => setFormData({...formData, data: e.target.value})}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Sala</label>
                  <select 
                    className={styles.input}
                    value={formData.roomId}
                    onChange={(e) => setFormData({...formData, roomId: e.target.value})}
                    required
                  >
                    {salas.map((sala) => (
                      <option key={sala.id} value={sala.id}>
                        {sala.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.row}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Início</label>
                    <input 
                      type="time" 
                      className={styles.input} 
                      value={formData.horaInicio}
                      onChange={(e) => setFormData({...formData, horaInicio: e.target.value})}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Fim</label>
                    <input 
                      type="time" 
                      className={styles.input} 
                      value={formData.horaFim}
                      onChange={(e) => setFormData({...formData, horaFim: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className={styles.buttonGroup}>
                  <button 
                    type="button" 
                    className={styles.btnSecondary} 
                    onClick={() => { setIsModalOpen(false); setModalStep(1); }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className={styles.btnPrimary}>
                    Avançar &rarr;
                  </button>
                </div>
              </form>

            ) : (

              /* --- ETAPA 2: DADOS DE CONTATO --- */
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Seu E-mail (Organizador)</label>
                  <input 
                    type="email" 
                    className={styles.input} 
                    placeholder="voce@empresa.com"
                    value={session?.user?.email || ''}
                    disabled
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>E-mail dos Participantes</label>
                  <textarea 
                    className={styles.textarea} 
                    placeholder="Separe os e-mails por vírgula. Ex: joao@empresa.com, maria@empresa.com"
                    value={formData.convidados}
                    onChange={(e) => setFormData({...formData, convidados: e.target.value})}
                  />
                </div>

                <div className={styles.buttonGroup}>
                  <button type="button" className={styles.btnSecondary} onClick={() => setModalStep(1)}>
                    &larr; Voltar
                  </button>
                  <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : 'Confirmar Reserva'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className={styles.toggleContainer}>
        <div className={styles.toggleWrapper}>
          <button 
            className={`${styles.toggleButton} ${viewMode === 'lista' ? styles.activeButton : ''}`}
            onClick={() => setViewMode('lista')}
          >
            Lista
          </button>
          <button 
            className={`${styles.toggleButton} ${viewMode === 'calendario' ? styles.activeButton : ''}`}
            onClick={() => setViewMode('calendario')}
          >
            Calendário
          </button>
        </div>
      </div>

      <section className={styles.contentArea}>
        {loading ? (
          <div className={styles.placeholderCard}>Carregando agenda...</div>
        ) : erro ? (
          <div className={styles.placeholderCard} style={{ color: 'red' }}>{erro}</div>
        ) : viewMode === 'lista' ? (
          
          <div className={styles.weekAgendaContainer}>
            
            {/* Navegador da Semana */}
            <div className={styles.weekHeader}>
              <button onClick={irParaSemanaAnterior} className={styles.navButton}>&lt;</button>
              <span className={styles.weekTitle}>
                Semana de {inicioDaSemana.toLocaleDateString('pt-BR')} a {fimDaSemana.toLocaleDateString('pt-BR')}
              </span>
              <button onClick={irParaProximaSemana} className={styles.navButton}>&gt;</button>
            </div>

            {/* Lista dos 7 Dias da Semana */}
            <div className={styles.weekDaysList}>
              {diasDaSemanaAtual.map((diaAtual) => {
                // Filtra as reuniões que caem EXATAMENTE neste dia
                const agendamentosDesteDia = agendamentos.filter((ag) => {
                  const dataAg = new Date(ag.startTime);
                  return dataAg.getDate() === diaAtual.getDate() &&
                         dataAg.getMonth() === diaAtual.getMonth() &&
                         dataAg.getFullYear() === diaAtual.getFullYear();
                });

                // Formatação do título do dia (Ex: Segunda-feira, 23/03)
                const nomeDoDia = diaAtual.toLocaleDateString('pt-BR', { weekday: 'long' });
                const dataCurta = diaAtual.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

                return (
                  <div key={diaAtual.toISOString()} className={styles.dayGroup}>
                    {/* Cabeçalho do Dia */}
                    <div className={styles.dayGroupHeader}>
                      <span className={styles.dayName}>{nomeDoDia}</span>
                      <span className={styles.dayDate}>{dataCurta}</span>
                    </div>

                    {/* Cartões de Reunião do Dia */}
                    <div className={styles.dayGroupCards}>
                      {agendamentosDesteDia.length === 0 ? (
                        <div className={styles.emptyDay}>Sem reuniões agendadas</div>
                      ) : (
                        agendamentosDesteDia.map((agendamento) => (
                          
                          /* O SEU CARTÃO INTACTO AQUI DENTRO */
                          <div key={agendamento.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                              <span className={styles.timeBadge}>
                                {formatarHorario(agendamento.startTime)} às {formatarHorario(agendamento.endTime)}
                              </span>
                              
                              {new Date(agendamento.endTime) < new Date() ? (
                                <span className={`${styles.statusBadge} ${styles.statusFinalizado}`}>Finalizado</span>
                              ) : (
                                <span className={`${styles.statusBadge} ${styles.statusConfirmado}`}>Confirmado</span>
                              )}

                              {session?.user?.email === agendamento.organizerEmail && new Date(agendamento.endTime) > new Date() ? (
                                <button 
                                  onClick={() => handleExcluir(agendamento.id)}
                                  className={styles.deleteButton}
                                  title="Cancelar Agendamento"
                                >
                                  🗑️
                                </button>
                              ) : ""}
                            </div>
                            
                            <div className={styles.cardBody}>
                              <h2 className={styles.clientName}>{agendamento.title}</h2>
                              <p className={styles.procedureInfo}>Sala: {agendamento.room?.name || 'Padrão'}</p>
                              <p className={styles.organizerInfo}>
                                👤 Reservado por: {agendamento.organizerEmail?.split('@')[0] || 'Desconhecido'}
                              </p>
                            </div>
                          </div>
                          /* FIM DO SEU CARTÃO */

                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        ) : (

          /* VISÃO EM CALENDÁRIO CONECTADA À API */
          <div className={styles.calendarSplitLayout}>
            
            {/* LADO DIREITO NO PC / TOPO NO CELULAR (Área Vermelha) */}
            <div className={styles.calendarSide}>
              <div className={styles.calendarContainer}>
                <div className={styles.monthHeader}>
                  <button onClick={mesAnterior} className={styles.navButton}>&lt;</button>
                  <span className={styles.monthTitle}>{mesPorExtenso}</span>
                  <button onClick={proximoMes} className={styles.navButton}>&gt;</button>
                </div>

                <div className={styles.weekDaysGrid}>
                  {diasDaSemana.map(dia => (
                    <div key={dia}>{dia}</div>
                  ))}
                </div>

                <div className={styles.daysGrid}>
                  {diasVazios.map(vazio => (
                    <div key={`vazio-${vazio}`} className={`${styles.dayCell} ${styles.emptyCell}`}></div>
                  ))}

                  {dias.map(dia => {
                    const isSelected = dia === diaSelecionado;
                    const hasEvent = verificarSeTemAgendamento(dia); 

                    return (
                      <button 
                        key={dia} 
                        onClick={() => setDiaSelecionado(dia)}
                        className={`${styles.dayCell} ${isSelected ? styles.selectedDay : ''}`}
                      >
                        {dia}
                        {hasEvent && <span className={styles.eventDot}></span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* LADO ESQUERDO NO PC / BAIXO NO CELULAR (Área Azul) */}
            <div className={styles.meetingsSide}>
                <h3 className={styles.selectedDayTitle}>
                  Reuniões para {diaSelecionado} de {mesPorExtenso.split(' ')[0]}
                </h3>
              <div className={styles.selectedDayEvents}>

                <div className={styles.listContainer}>
                  {agendamentosDoDiaSelecionado.length === 0 ? (
                    <div className={styles.emptyStateMessage}>
                      Nenhuma reunião agendada para este dia.
                    </div>
                  ) : (
                    agendamentosDoDiaSelecionado.map((agendamento) => (
                      <div key={agendamento.id} className={styles.card}>
                        <div className={styles.cardHeader}>
                          <span className={styles.timeBadge}>
                            {formatarHorario(agendamento.startTime)} - {formatarHorario(agendamento.endTime)}
                          </span>
                          
                          {new Date(agendamento.endTime) < new Date() ? (
                            <span className={`${styles.statusBadge} ${styles.statusFinalizado}`}>
                              Finalizado
                            </span>
                          ) : (
                            <span className={`${styles.statusBadge} ${styles.statusConfirmado}`}>
                              Confirmado
                            </span>
                          )}

                          {session?.user?.email === agendamento.organizerEmail && new Date(agendamento.endTime) > new Date() ? (
                            <button 
                              onClick={() => handleExcluir(agendamento.id)}
                              className={styles.deleteButton}
                              title="Cancelar Agendamento"
                            >
                              🗑️
                            </button>
                          ) : ""}
                        </div>
                        <div className={styles.cardBody}>
                          <h2 className={styles.clientName}>{agendamento.title}</h2>
                          <p className={styles.procedureInfo}>Sala: {agendamento.room?.name || 'Sem sala definida'}</p>
                          <p className={styles.organizerInfo}>
                            👤 Reservado por: {agendamento.organizerEmail?.split('@')[0] || 'Desconhecido'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </section>
    </main>
  );
}