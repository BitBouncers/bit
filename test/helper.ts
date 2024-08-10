import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { RequestGenericInterface } from "fastify/types/request";
import { default as buildFastify } from "../src/app";
import {
  AUTH_TOKEN,
  USER_EMAIL_PATIENT,
  USER_EMAIL_PHYSICIAN,
  USER_EMAIL_RADIOLOGIST,
  USER_PW,
} from "./variables";

type CompareArraysOfObjects<T> = (arr1: T[], arr2: T[]) => boolean;

const buildLiveApp = async (opts: { log: boolean }) => {
  const server: FastifyInstance = await buildFastify(opts);

  beforeAll(async () => {
    await server.ready();
  });

  afterAll(() => server.close());

  return server;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const compareArrayOfObjects: CompareArraysOfObjects<any> = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }

  const obj1 = a.reduce((acc, obj) => ({ ...acc, ...obj }), {});
  const obj2 = a.reduce((acc, obj) => ({ ...acc, ...obj }), {});

  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

export const buildFastifyRequest = <T extends RequestGenericInterface>(
  overrides: Partial<FastifyRequest<T>>
): FastifyRequest<T> => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    server: {},
    ...overrides,
  } as FastifyRequest<T>;
};

export const buildFastifyReply = (): FastifyReply => {
  const reply: Partial<FastifyReply> = {};
  reply.code = jest.fn().mockReturnValue(reply);
  reply.send = jest.fn().mockReturnValue(reply);
  reply.status = jest.fn().mockReturnValue(reply);
  return reply as FastifyReply;
};

const testApp = buildFastify({ log: false });

beforeAll(async () => {
  const response = await testApp.inject({
    method: "POST",
    url: "/api/auth/login",
    body: { email: USER_EMAIL_PATIENT, password: USER_PW },
  });

  const response2 = await testApp.inject({
    method: "POST",
    url: "/api/auth/login",
    body: { email: USER_EMAIL_PHYSICIAN, password: USER_PW },
  });

  const response3 = await testApp.inject({
    method: "POST",
    url: "/api/auth/login",
    body: { email: USER_EMAIL_RADIOLOGIST, password: USER_PW },
  });

  AUTH_TOKEN.set("PATIENT", response.json().idToken);
  AUTH_TOKEN.set("PHYSICIAN", response2.json().idToken);
  AUTH_TOKEN.set("RADIOLOGIST", response3.json().idToken);
});

afterAll(async () => {
  testApp.close();
}, 30000);

export { testApp as app, buildLiveApp, compareArrayOfObjects };
