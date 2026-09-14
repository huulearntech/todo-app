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
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

type LoginUserReqDto = {
  email: string;
  password: string;
};

type LoginUserResDto = {
  accessToken: string;
};

export type {
  User,
  CreateUserReqDto,
  CreateUserResDto,
  LoginUserReqDto,
  LoginUserResDto,
};