export interface IProfile {
  id: string;
  userId: string;
  name: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Profile implements IProfile {
  constructor(
    public id: string,
    public userId: string,
    public name: string,
    public bio: string | undefined,
    public createdAt: Date,
    public updatedAt: Date
  ) {}
}
