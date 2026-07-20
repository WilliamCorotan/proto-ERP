import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { createPrismaClient } from "@erp/db";
import { hashPassword, signAuthToken, verifyAuthToken, verifyPassword, type AuthTokenPayload } from "@erp/core/security";

export type LoginInput = {
  tenantSlug: string;
  email: string;
  password: string;
};

export type AuthSession = {
  token: string;
  user: {
    id: string;
    tenantId: string;
    email: string;
    name: string;
    roles: string[];
    permissions: string[];
  };
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  roles: string[];
};

export type AdminRole = {
  id: string;
  key: string;
  name: string;
  permissions: string[];
};

export type CreateUserInput = {
  email: string;
  name: string;
  password: string;
  roleKeys: string[];
};

const DEVELOPMENT_JWT_SECRET = "development-only-jwt-secret-not-for-production";
const MINIMUM_PRODUCTION_SECRET_LENGTH = 32;
const KNOWN_PLACEHOLDER_SECRETS = new Set([
  "change-me",
  "changeme",
  "dev-only-change-me",
  "jwt-secret",
  "replace-me",
  "secret",
  "your-secret",
]);

type JwtSecretEnvironment = {
  JWT_SECRET?: string | undefined;
  NODE_ENV?: string | undefined;
};

export function resolveJwtSecret(
  environment: JwtSecretEnvironment = process.env,
): string {
  const configuredSecret = environment.JWT_SECRET;
  if (environment.NODE_ENV !== "production") {
    return configuredSecret || DEVELOPMENT_JWT_SECRET;
  }

  if (!configuredSecret) {
    throw new Error(
      "JWT_SECRET is required when NODE_ENV is production.",
    );
  }

  const normalizedSecret = configuredSecret.trim().toLowerCase();
  const uniqueCharacters = new Set(configuredSecret).size;
  if (
    configuredSecret.length < MINIMUM_PRODUCTION_SECRET_LENGTH ||
    uniqueCharacters < 8 ||
    KNOWN_PLACEHOLDER_SECRETS.has(normalizedSecret)
  ) {
    throw new Error(
      "JWT_SECRET must be at least 32 characters and must not be a placeholder or low-diversity value in production.",
    );
  }

  return configuredSecret;
}

const jwtSecret = resolveJwtSecret();

@Injectable()
export class AuthService {
  private readonly prisma = createPrismaClient();

  async login(input: LoginInput): Promise<AuthSession> {
    const user = await this.prisma.user.findFirst({
      where: {
        email: input.email,
        tenant: { slug: input.tenantSlug },
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const roles = user.roles.map((assignment) => assignment.role.key);
    const permissions = [...new Set(user.roles.flatMap((assignment) => assignment.role.permissions))].sort();
    const token = signAuthToken(
      {
        sub: user.id,
        tenantId: user.tenantId,
        email: user.email,
        roles,
        permissions
      },
      jwtSecret
    );

    return {
      token,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        name: user.name,
        roles,
        permissions
      }
    };
  }

  currentUser(authorizationHeader: string | undefined): AuthTokenPayload {
    const token = this.extractBearerToken(authorizationHeader);
    const payload = verifyAuthToken(token, jwtSecret);
    if (!payload) {
      throw new UnauthorizedException("Invalid or expired token.");
    }
    return payload;
  }

  requirePermission(authorizationHeader: string | undefined, permission: string): AuthTokenPayload {
    const payload = this.currentUser(authorizationHeader);
    if (!payload.permissions.includes(permission)) {
      throw new ForbiddenException(`Missing permission: ${permission}`);
    }
    return payload;
  }

  async users(tenantId: string): Promise<AdminUser[]> {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      include: { roles: { include: { role: true } } },
      orderBy: { email: "asc" }
    });
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.map((assignment) => assignment.role.key).sort()
    }));
  }

  async roles(tenantId: string): Promise<AdminRole[]> {
    const roles = await this.prisma.role.findMany({
      where: { tenantId },
      orderBy: { key: "asc" }
    });
    return roles.map((role) => ({
      id: role.id,
      key: role.key,
      name: role.name,
      permissions: role.permissions
    }));
  }

  async createUser(tenantId: string, input: CreateUserInput): Promise<AdminUser> {
    const passwordHash = await hashPassword(input.password);
    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: input.email,
        name: input.name,
        passwordHash
      }
    });

    const roles = await this.prisma.role.findMany({
      where: {
        tenantId,
        key: { in: input.roleKeys }
      }
    });

    if (roles.length > 0) {
      await this.prisma.userRole.createMany({
        data: roles.map((role) => ({
          userId: user.id,
          roleId: role.id
        })),
        skipDuplicates: true
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: roles.map((role) => role.key).sort()
    };
  }

  private extractBearerToken(authorizationHeader: string | undefined): string {
    if (!authorizationHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Bearer token is required.");
    }
    return authorizationHeader.slice("Bearer ".length);
  }
}
