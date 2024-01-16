import { FastifyInstance } from "fastify";
import realApp from "../src/app";

type CompareArraysOfObjects<T> = (arr1: T[], arr2: T[]) => boolean;

const build = () => {
  const server: FastifyInstance = realApp;

  beforeAll(async () => {
    await server.ready();
  });

  afterAll(() => server.close());

  return server;
};

const compareArrayOfObjects: CompareArraysOfObjects<any> = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }

  const obj1 = a.reduce((acc, obj) => ({ ...acc, ...obj }), {});
  const obj2 = a.reduce((acc, obj) => ({ ...acc, ...obj }), {});

  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

const app = build();

export { app, build, compareArrayOfObjects };
