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
import { PasswordInput } from "@/components/ui/password-input"
import { useState } from "react"
import { useToast } from "@/helpers/ToastProvider"
import { useFormErrors } from "@/helpers/useFormErrors"
import { ROLES, useAuth } from "@/api/context/AuthContext"
import {
  EMAIL_TAKEN_MSG,
  INVALID_CREDENTIALS_MSG,
  LOGGED_IN_MSG,
  REGISTERED_MSG,
} from "@/helpers/Errors"

const EMPTY_LOGIN = {
  email: "",
  password: "",
}

const ACCOUNT_TYPES = [
  { value: "CITIZEN", label: "Mieszkaniec", hint: "Konto osoby prywatnej" },
  { value: "NGO", label: "Organizacja pozarządowa", hint: "Fundacja, stowarzyszenie, KGW – wymagany NIP" },
]

const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7]

function nipError(raw) {
  const digits = raw.replace(/[\s-]/g, "")
  if (!/^\d{10}$/.test(digits)) return "NIP musi mieć 10 cyfr, np. 123-456-32-18"
  const sum = NIP_WEIGHTS.reduce((acc, w, i) => acc + w * Number(digits[i]), 0) % 11
  if (sum === 10 || sum !== Number(digits[9])) return "Niepoprawny NIP – sprawdź cyfry"
  return null
}

const EMPTY_REGISTER = {
  accountType: "CITIZEN",
  nip: "",
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
    const { name, email, password, confirmPassword, accountType, nip } = registerData;
    const ngo = accountType === "NGO";

    if (!name.trim()) return ["name", ngo ? "Podaj nazwę organizacji" : "Podaj imię i nazwisko"];
    if (ngo && nipError(nip)) return ["nip", nipError(nip)];
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
        role: registerData.accountType === "NGO" ? ROLES.NGO : ROLES.CITIZEN,
        nip: registerData.accountType === "NGO" ? registerData.nip.replace(/[\s-]/g, "") : null,
      });
      showToast(REGISTERED_MSG, "success");
      setRegisterData(EMPTY_REGISTER);
      onSuccess?.();
    } catch (err) {
      if (err?.status === 409) registerErrors.fail("email", EMAIL_TAKEN_MSG);
      else if (err?.status === 400 && err.body?.message?.includes("NIP")) registerErrors.fail("nip", err.body.message);
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
                    <PasswordInput
                      {...loginErrors.fieldProps("password")}
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
                Konto mieszkańca albo organizacji pozarządowej. Wszystkie pola są wymagane. Konta samorządów i ROPS zakłada administrator platformy.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitRegister} noValidate>
                <FieldGroup>
                  <fieldset className="flex flex-col gap-2">
                    <legend className="mb-2 text-sm font-medium">Typ konta</legend>
                    {ACCOUNT_TYPES.map((type) => (
                      <label
                        key={type.value}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-xl border p-3",
                          registerData.accountType === type.value ? "border-primary bg-muted/60" : "border-foreground/45"
                        )}
                      >
                        <input
                          type="radio"
                          name="register-account-type"
                          value={type.value}
                          checked={registerData.accountType === type.value}
                          onChange={updateRegister("accountType")}
                          className="mt-1 size-4 accent-[var(--primary)]"
                        />
                        <span>
                          <span className="block text-sm font-medium">{type.label}</span>
                          <span className="block text-xs text-muted-foreground">{type.hint}</span>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                  <Field>
                    <FieldLabel htmlFor="register-name">
                      {registerData.accountType === "NGO" ? "Nazwa organizacji" : "Imię i nazwisko"}
                    </FieldLabel>
                    <Input
                      {...registerErrors.fieldProps("name")}
                      type="text"
                      required
                      autoComplete={registerData.accountType === "NGO" ? "organization" : "name"}
                      placeholder={registerData.accountType === "NGO" ? "np. Fundacja Dobre Sąsiedztwo" : "np. Jan Kowalski"}
                      value={registerData.name}
                      onChange={updateRegister("name")}
                    />
                    <FieldError {...registerErrors.errorProps("name")} />
                  </Field>
                  {registerData.accountType === "NGO" && (
                    <Field>
                      <FieldLabel htmlFor="register-nip">NIP organizacji</FieldLabel>
                      <Input
                        {...registerErrors.fieldProps("nip", "register-nip-hint")}
                        type="text"
                        inputMode="numeric"
                        required
                        maxLength={13}
                        placeholder="np. 1234563218"
                        value={registerData.nip}
                        onChange={updateRegister("nip")}
                      />
                      <FieldDescription id="register-nip-hint">10 cyfr, możesz wpisać z myślnikami.</FieldDescription>
                      <FieldError {...registerErrors.errorProps("nip")} />
                    </Field>
                  )}
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
                    <PasswordInput
                      {...registerErrors.fieldProps("password", "register-password-hint")}
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
                    <PasswordInput
                      {...registerErrors.fieldProps("confirmPassword")}
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