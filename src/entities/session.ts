const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export interface SessionProps {
  token: string;
  userId: string;
  expiresAt: Date;
}

export class Session {
  private readonly props: SessionProps;

  constructor(token: string, userId: string, now = new Date()) {
    this.props = {
      token,
      userId,
      expiresAt: new Date(now.getTime() + SESSION_DURATION_MS),
    };
  }

  get token() {
    return this.props.token;
  }

  get userId() {
    return this.props.userId;
  }

  get expiresAt() {
    return this.props.expiresAt;
  }
}
