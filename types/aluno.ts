export type Aluno = {
  empresa_id: string;
  nome: string;
  dataNascimento: string;
  responsavel: string;
  whatsapp: string;
  email: string;
  mensalidade: number;
  vencimento: string;
  observacoes: string;

  data_inicio?: string;
  data_fim?: string;
  status_matricula?: string;
};