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

// TODO: Remove @Redundant
type SignInUserReqDto = {
  email: string;
  password: string;
};

type SignInUserResDto = {
  accessToken: string;
};

export type {
  User,
  CreateUserReqDto,
  CreateUserResDto,
  SignInUserReqDto,
  SignInUserResDto,
};