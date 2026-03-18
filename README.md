# Schronisko Fullstack App

## 1. Przegląd Projektu

### Cel Systemu

**Schronisko Fullstack App** to centralna platforma zaprojektowana do agregacji, wizualizacji i analizy danych dotyczących schronisk dla zwierząt. Głównym celem jest zwiększenie przejrzystości w sektorze dobrostanu zwierząt poprzez udostępnienie ujednoliconego interfejsu do przeglądania profili schronisk oraz oceny ich wiarygodności bazującej na twardych danych.

### Rozwiązywany Problem

Dane dotyczące schronisk są często rozproszone, nieustrukturyzowane i trudne do weryfikacji. Brak centralnego rejestru utrudnia:

- Adopcję zwierząt ze sprawdzonych miejsc.
- Monitorowanie warunków bytowych przez gminy i organizacje.
- Szybką ocenę, czy dana placówka działa legalnie i transparentnie.

Aplikacja rozwiązuje ten problem poprzez normalizację danych i wprowadzenie **Wskaźnika Zaufania (Trust Score)**.

---

## 2. Kluczowe Funkcje

- **Interaktywna Mapa:** Wizualizacja lokalizacji schronisk w regionie.
- **Profile Schronisk:** Szczegółowe karty placówek zawierające dane operatora, statystyki i informacje kontaktowe.
- **System Oceny Zaufania (Trust Score):** Algorytmiczna ocena wiarygodności schroniska.
- **Ustrukturyzowane Opinie:** System recenzji pozwalający społeczności na ocenę placówek.
- **System Zgłoszeń:** Możliwość zgłaszania nieprawidłowości lub błędnych danych.

---

## 3. Model Danych (Uproszczony)

### Obiekt Schroniska (Shelter)

Główna encja zawierająca:

- **Tożsamość:** Nazwa, Operator, NIP, KRS, Status licencji.
- **Lokalizacja:** Współrzędne geograficzne, Gmina.
- **Przejrzystość:** Poziom dostępu publicznego, liczba źródeł danych.

### Wskaźniki Dobrostanu (Welfare Indicators)

Metryki oceniające jakość opieki:

- **Pojemność:** Szacowana liczba miejsc vs rzeczywista liczba zwierząt (Wskaźnik przepełnienia).
- **Wyniki:** Liczba adopcji, wskaźniki śmiertelności.
- **Programy:** Dostępność wolontariatu, nadzór weterynaryjny.

### Struktura Opinii

- Opinie użytkowników, które wpływają na "miękką" część oceny schroniska.

---

## 4. Wyjaśnienie Wskaźnika Zaufania (Trust Score)

System stosuje ważony algorytm do obliczenia ogólnej oceny wiarygodności (0-100%).

### Formuła Główna

$$
\text{Final Score} = (\text{Structured Score} \times 0.55) + (\text{Review Score} \times 0.45)
$$

### Wynik Strukturalny (Dane twarde)

Obliczany na podstawie weryfikowalnych metryk:

$$
\text{Structured Score} = (\text{Formal Score} \times 0.65) + (\text{Welfare Score} \times 0.35)
$$

1.  **Formal Score (Prawno-Administracyjny):**
    - Weryfikacja tożsamości operatora i rejestracji (NIP/KRS).
    - Potwierdzony nadzór weterynaryjny i status licencji.
    - Poziom transparentności i współpraca z gminą.
    - Dostępność kanałów kontaktu (Telefon/Email/WWW).

2.  **Welfare Score (Dobrostan):**
    - **Przepełnienie:** Stosunek liczby zwierząt do pojemności.
    - **Otwartość:** Poziom dostępu dla osób z zewnątrz (np. wolontariuszy).
    - **Programy:** Aktywny wolontariat i skuteczność adopcji.
    - **Zdrowie:** Wskaźniki śmiertelności zwierząt.

---

## 5. Technologia (Tech Stack)

### Backend

- **Język:** Python 3.13+
- **Framework:** FastAPI
- **Baza danych:** PostgreSQL (driver asyncpg)
- **Walidacja:** Pydantic

### Frontend

- **Framework:** React 19
- **Build Tool:** Vite
- **Style:** TailwindCSS
- **Mapy:** Leaflet / React-Leaflet

---

## 6. Przyszłe Usprawnienia

- **Weryfikacja Schronisk:** Wdrożenie systemu odznak "Zweryfikowane Schronisko" dla operatorów, którzy potwierdzą swoją tożsamość.
- **Moderacja:** Panel administracyjny do zarządzania zgłoszeniami i recenzjami.
- **Integracja z Rejestrami:** Automatyczne pobieranie danych z publicznych rejestrów weterynaryjnych (np. GLW).
- **Zaawansowane Raporty:** Generowanie PDF z podsumowaniem działalności schroniska dla gmin.
