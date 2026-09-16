// TODO: Dedup the types between client and server.

type User = {
  id: string;
  email: string;
  name: string;
  password: string;
  avatarUrl?: string;
};

type CreateUserReqDto = {
  email: string;
  name: string;
  password: string;
  avatarUrl?: string;
};

type CreateUserResDto = {
  email: string;
  name: string;
  avatarUrl?: string;
};

type SignInUserResDto = {
  accessToken: string;
};

export type {
  User,
  CreateUserReqDto,
  CreateUserResDto,
  SignInUserResDto,
};