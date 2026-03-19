<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# pages

## Purpose
Page-level React components mapped to routes. Each file represents a unique URL path in the application.

## Key Files

### Public Pages
| File | Route | Description |
|------|-------|-------------|
| `Home.tsx` | `/` | Homepage with hero, features, programs, testimonials |
| `Programs.tsx` | `/programs` | Programs listing grid |
| `About.tsx` | `/about` | 7-section about page |
| `Schedule.tsx` | `/schedule` | Weekly/monthly class schedule |
| `Testimonials.tsx` | `/testimonials` | Testimonials page |
| `Contact.tsx` | `/contact` | Contact form |
| `TechniqueLibrary.tsx` | `/techniques` | GrappleMap 3D browser |
| `RegistrationHub.tsx` | `/register` | Registration hub/landing |
| `not-found.tsx` | `*` | 404 not found page |

### Registration Pages (Subdirectory)
| File | Route | Description |
|------|-------|-------------|
| `registration/BJJRegistration.tsx` | `/programs/bjj/register` | BJJ registration wizard |
| `registration/ArcheryRegistration.tsx` | `/programs/archery/register` | Archery registration |
| `registration/OutdoorRegistration.tsx` | `/programs/outdoor/register` | Outdoor registration |
| `registration/BullyproofingRegistration.tsx` | `/programs/bullyproofing/register` | Bullyproofing registration |
| `registration/RegistrationSuccess.tsx` | `/registration/success` | Payment success |
| `registration/RegistrationCancel.tsx` | `/registration/cancel` | Payment cancelled |
| `registration/RegistrationPending.tsx` | `/registration/pending` | Payment pending |
| `registration/RegistrationWaitlist.tsx` | `/registration/waitlist` | Waitlist confirmation |

### Program Pages (Subdirectory)
| File | Route | Description |
|------|-------|-------------|
| `programs/BJJProgram.tsx` | `/programs/bjj` | BJJ program details |
| `programs/ArcheryProgram.tsx` | `/programs/archery` | Archery program details |
| `programs/OutdoorWorkshopsProgram.tsx` | `/programs/outdoor` | Outdoor program details |
| `programs/BullyproofingProgram.tsx` | `/programs/bullyproofing` | Bullyproofing details |

### Admin Pages (Subdirectory)
| File | Route | Description |
|------|-------|-------------|
| `admin/AdminLogin.tsx` | `/admin` | Admin login page |
| `admin/AdminDashboard.tsx` | `/admin/dashboard` | Admin dashboard |

## For AI Agents

### Working In This Directory
- Pages are route components imported in `App.tsx`
- Use route parameters via `useParams()` from wouter
- Page components can be larger - compose from `components/`
- SEO meta tags go in page components

### Patterns
- Import page-specific components from subdirectories
- Use `useEffect` for data fetching on mount
- Handle loading and error states
- Navigate programmatically with `useLocation()` from wouter

<!-- MANUAL: -->
