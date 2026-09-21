// TODO: Dedup the types between client and server.

type CreateUserResDto = {
  email: string;
  name: string;
  avatarUrl?: string;
  defaultProjectId: string;
};

export type {
  CreateUserResDto,
};