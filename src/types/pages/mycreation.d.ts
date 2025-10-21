export interface MyCreationPageData {
  my_creations: {
    title?: string,
    description?: string,
    empty?: string,
    pagination: {
      previous?: string,
      next?: string
    },
    status: {
      pending?: string,
      processing?: string,
      completed?: string,
      failed?: string
    },
    table: {
      id?: string,
      model: string,
      status: string,
      output: string,
      created: string,
      actions: string
    },
    actions: {
      open: string,
      download: string
    }
  }
}
