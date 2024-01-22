declare namespace bit {
  export interface AuthLoginResponse {
    localId: string;
    displayName: string | null;
    idToken: string;
    refreshToken: string;
  }

  export interface AuthLoginResponseError {
    errors: [
      {
        msg: string;
        path: string;
      },
    ];
  }
}
