export function toPortugueseError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return 'Ocorreu um erro inesperado. Tente novamente.';
  if (error.code === '23503') return 'A categoria está a ser utilizada e não pode ser eliminada.';
  if (error.code === '23505') return 'Já existe um registo com estes dados.';
  if (error.code === '42501') return 'Não tem permissão para realizar esta operação.';
  if (error.code === 'PGRST116') return 'O registo solicitado não foi encontrado.';
  if (error.message?.toLowerCase().includes('email'))
    return 'O email ou a password estão incorrectos.';
  return error.message || 'Ocorreu um erro inesperado. Tente novamente.';
}

export function assertServerEnv() {
  if (typeof window !== 'undefined') {
    throw new Error('Operação server-only chamada no browser.');
  }
}
