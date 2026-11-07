/** `isTrusted` separa o gesto real do evento disparado por script (`dispatchEvent`). Isolado para os testes poderem simular. */
export const gestoConfiavel = (evento: Event): boolean => evento.isTrusted
