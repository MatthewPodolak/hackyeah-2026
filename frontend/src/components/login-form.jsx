"use client"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"
import { useToast } from "@/helpers/ToastProvider"
import { useFormErrors } from "@/helpers/useFormErrors"
import { ROLES, ROLE_LABELS, useAuth } from "@/api/context/AuthContext"
import {
  EMAIL_TAKEN_MSG,
  INVALID_CREDENTIALS_MSG,
  LOGGED_IN_MSG,
  REGISTERED_MSG,
} from "@/helpers/Errors"

const USER_TYPES = [
  { value: ROLES.CITIZEN, label: ROLE_LABELS.CITIZEN, short: "O", hint: "Mieszkaniec" },
  { value: ROLES.JST, label: ROLE_LABELS.JST, short: "J", hint: "Samorząd" },
  { value: ROLES.ROPS, label: ROLE_LABELS.ROPS, short: "R", hint: "Pomoc społeczna" },
]

const EMPTY_LOGIN = {
  email: "",
  password: "",
}

const EMPTY_REGISTER = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function LinkButton({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="font-medium text-foreground underline underline-offset-4 hover:no-underline">
      {children}
    </button>
  )
}

export function LoginForm({
  className,
  initialMode = "login",
  onSuccess,
  headingLevel = 2,
  ...props
}) {
  const { showToast } = useToast();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(initialMode !== "register");
  const [selectedUserType, setSelectedUserType] = useState(ROLES.CITIZEN);
  const [loginData, setLoginData] = useState(EMPTY_LOGIN);
  const [registerData, setRegisterData] = useState(EMPTY_REGISTER);
  const [loading, setLoading] = useState(false);
  const loginErrors = useFormErrors("login");
  const registerErrors = useFormErrors("register");
  const Heading = `h${headingLevel}`;

  const updateLogin = (field) => (e) => {
    setLoginData((prev) => ({ ...prev, [field]: e.target.value }));
    loginErrors.clear(field);
  };

  const updateRegister = (field) => (e) => {
    setRegisterData((prev) => ({ ...prev, [field]: e.target.value }));
    registerErrors.clear(field);
  };

  const switchMode = (toLogin) => {
    setIsLogin(toLogin);
    loginErrors.reset();
    registerErrors.reset();
    requestAnimationFrame(() => document.getElementById("auth-heading")?.focus());
  };

  const validateLogin = () => {
    const { email, password } = loginData;

    if (!email.trim()) return ["email", "Podaj adres email"];
    if (!EMAIL_REGEX.test(email.trim())) return ["email", "Niepoprawny adres email, np. jan@example.com"];
    if (!password) return ["password", "Podaj hasło"];
    return null;
  };

  const validateRegister = () => {
    const { name, email, password, confirmPassword } = registerData;

    if (!name.trim()) return ["name", selectedUserType === ROLES.CITIZEN ? "Podaj imię i nazwisko" : "Podaj nazwę instytucji"];
    if (!email.trim()) return ["email", "Podaj adres email"];
    if (!EMAIL_REGEX.test(email.trim())) return ["email", "Niepoprawny adres email, np. jan@example.com"];
    if (password.length < 8) return ["password", "Hasło musi mieć co najmniej 8 znaków"];
    if (password !== confirmPassword) return ["confirmPassword", "Hasła nie są takie same"];
    return null;
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    const error = validateLogin();
    if (error) {
      loginErrors.fail(...error);
      return;
    }

    setLoading(true);
    try {
      await login({ email: loginData.email.trim(), password: loginData.password });
      showToast(LOGGED_IN_MSG, "success");
      setLoginData(EMPTY_LOGIN);
      onSuccess?.();
    } catch (err) {
      if (err?.status === 401) loginErrors.fail("password", INVALID_CREDENTIALS_MSG);
      else showToast(null, "error");
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    if (loading) return;

    const error = validateRegister();
    if (error) {
      registerErrors.fail(...error);
      return;
    }

    setLoading(true);
    try {
      await register({
        name: registerData.name.trim(),
        email: registerData.email.trim(),
        password: registerData.password,
        role: selectedUserType,
      });
      showToast(REGISTERED_MSG, "success");
      setRegisterData(EMPTY_REGISTER);
      onSuccess?.();
    } catch (err) {
      if (err?.status === 409) registerErrors.fail("email", EMAIL_TAKEN_MSG);
      else showToast(null, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        {isLogin ? (
          <>
            <CardHeader>
              <CardTitle>
                <Heading id="auth-heading" tabIndex={-1} className="text-base font-semibold outline-none">Zaloguj się</Heading>
              </CardTitle>
              <CardDescription id="auth-description">
                Podaj email i hasło, aby zalogować się do konta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitLogin} noValidate>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="login-email">Email</FieldLabel>
                    <Input
                      {...loginErrors.fieldProps("email")}
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="np. jan@example.com"
                      value={loginData.email}
                      onChange={updateLogin("email")}
                    />
                    <FieldError {...loginErrors.errorProps("email")} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="login-password">Hasło</FieldLabel>
                    <Input
                      {...loginErrors.fieldProps("password")}
                      type="password"
                      autoComplete="current-password"
                      required
                      value={loginData.password}
                      onChange={updateLogin("password")}
                    />
                    <FieldError {...loginErrors.errorProps("password")} />
                  </Field>
                  <Field>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Logowanie..." : "Zaloguj"}
                    </Button>
                    <FieldDescription className="text-center">
                      Nie masz konta? <LinkButton onClick={() => switchMode(false)}>Zarejestruj się</LinkButton>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </>
        ):(
          <>
            <CardHeader>
              <CardTitle>
                <Heading id="auth-heading" tabIndex={-1} className="text-base font-semibold outline-none">Utwórz konto</Heading>
              </CardTitle>
              <CardDescription id="auth-description">
                Wybierz typ konta i uzupełnij dane. Wszystkie pola są wymagane.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitRegister} noValidate>
                <FieldGroup>
                  <div role="radiogroup" aria-labelledby="register-type-label" className="flex flex-col gap-2">
                    <p id="register-type-label" className="text-sm font-medium">Typ konta</p>
                    <div className="w-full flex flex-wrap items-center justify-center gap-3">
                      {USER_TYPES.map((type) => {
                        const selected = selectedUserType === type.value
                        return (
                          <button
                            key={type.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => setSelectedUserType(type.value)}
                            className={cn(
                              "relative flex flex-col items-center gap-2 cursor-pointer rounded-lg border-2 px-4 py-3 min-w-24 transition-colors",
                              selected
                                ? "border-blue-600 bg-blue-500/10 text-blue-800 dark:text-blue-300"
                                : "border-neutral-500 dark:border-neutral-400 hover:border-neutral-700 dark:hover:border-neutral-200"
                            )}
                          >
                            {selected && (
                              <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} aria-hidden="true" className="absolute right-1.5 top-1.5 size-4" />
                            )}
                            <div
                              aria-hidden="true"
                              className={cn(
                                "w-12 h-12 rounded-full border-2 flex items-center justify-center font-semibold transition-colors",
                                selected
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-neutral-500 dark:border-neutral-400"
                              )}
                            >
                              {type.short}
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-medium">{type.label}</span>
                              <span className="text-xs text-muted-foreground">{type.hint}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="register-name">
                      {selectedUserType === ROLES.CITIZEN ? "Imię i nazwisko" : "Nazwa instytucji"}
                    </FieldLabel>
                    <Input
                      {...registerErrors.fieldProps("name")}
                      type="text"
                      required
                      autoComplete={selectedUserType === ROLES.CITIZEN ? "name" : "organization"}
                      placeholder={selectedUserType === ROLES.CITIZEN ? "np. Jan Kowalski" : "np. Urząd Miasta Krakowa"}
                      value={registerData.name}
                      onChange={updateRegister("name")}
                    />
                    <FieldError {...registerErrors.errorProps("name")} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="register-email">Email</FieldLabel>
                    <Input
                      {...registerErrors.fieldProps("email")}
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="np. jan@example.com"
                      value={registerData.email}
                      onChange={updateRegister("email")}
                    />
                    <FieldError {...registerErrors.errorProps("email")} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="register-password">Hasło</FieldLabel>
                    <Input
                      {...registerErrors.fieldProps("password", "register-password-hint")}
                      type="password"
                      required
                      autoComplete="new-password"
                      value={registerData.password}
                      onChange={updateRegister("password")}
                    />
                    <FieldDescription id="register-password-hint">Co najmniej 8 znaków.</FieldDescription>
                    <FieldError {...registerErrors.errorProps("password")} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="register-confirmPassword">Powtórz hasło</FieldLabel>
                    <Input
                      {...registerErrors.fieldProps("confirmPassword")}
                      type="password"
                      required
                      autoComplete="new-password"
                      value={registerData.confirmPassword}
                      onChange={updateRegister("confirmPassword")}
                    />
                    <FieldError {...registerErrors.errorProps("confirmPassword")} />
                  </Field>
                  <Field>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Tworzenie konta..." : "Utwórz konto"}
                    </Button>
                    <FieldDescription className="text-center">
                      Masz już konto? <LinkButton onClick={() => switchMode(true)}>Zaloguj się</LinkButton>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
