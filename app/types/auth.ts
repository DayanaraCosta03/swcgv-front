export interface ResponseAuthLogin {
  token: string;
  user: User;
}

export interface User {
  id: number;
  name: string;
  email: string;
}
