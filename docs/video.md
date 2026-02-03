# OCRS Project Video Script
**Duration:** ~5-6 minutes  
**Speaker:** Vaibhav Ghage

---

## INTRO (30 seconds)

> Hello everyone, my name is Vaibhav Ghage.

> Today, I will walk you through our project called OCRS – the Online Crime Reporting System.

> I will cover what this project does, what parts I built, the challenges I faced, and how I solved them.

> Let's get started.

---

## SECTION 1: PROJECT OVERVIEW (1 minute)

> So what is OCRS?

> OCRS is a web-based system that allows citizens to file First Information Reports, also known as FIRs, and Missing Person Reports through the internet.

> Instead of going to a police station and waiting in long queues, a citizen can simply log in to our website, fill out a form, and submit their complaint.

> On the other side, we have authorities – the police officers – who can log in to their dashboard, view the cases assigned to them, and update the status of each case.

> We also have an admin panel where administrators can manage users and authorities.

> The project is built using a microservices architecture. This means instead of one big application, we have multiple small services that talk to each other.

> We have services like the Auth Service for login and signup, a Backend Service for handling FIRs and reports, an API Gateway that acts as the main entry point, a Eureka Server for service discovery, and a React-based frontend.

---

## SECTION 2: MY CONTRIBUTIONS (2 minutes)

> Now let me talk about what I specifically built in this project.

### Auth Service

> First, I worked on the **Auth Service**.

> This service handles all the authentication and authorization. When a user signs up, their password is encrypted and stored safely. When they log in, the service creates a JWT token – a secure token that proves who they are.

> I implemented the complete JWT flow including access tokens and refresh tokens. Refresh tokens allow users to stay logged in for longer without entering their password again.

> I also created internal APIs that other services use. For example, the backend service calls the auth service to get a list of active authorities for assigning FIR cases.

### API Gateway

> Next, I built the **API Gateway** from scratch.

> The API Gateway is the single entry point for all requests. Every request from the frontend first comes to the gateway.

> Here, I implemented several important features:

> First, **JWT validation**. The gateway checks if the incoming request has a valid token. If not, it sends back a proper error message.

> Second, **role-based access control**. Some routes are only for admins, some only for authorities. The gateway checks the user's role and blocks them if they don't have permission.

> Third, **rate limiting** using Redis. This protects our system from too many requests. For example, login attempts are limited to prevent brute force attacks.

> Fourth, **CORS handling**. This was tricky because the frontend runs on a different port than the backend. I had to make sure the browser allows these cross-origin requests.

> Fifth, **header enrichment**. After validating the token, the gateway adds headers like X-User-Id and X-User-Role to the request. This way, the backend services know who is making the request without parsing the token again.

### Eureka Server

> I also set up the **Eureka Server** for service discovery.

> In a microservices setup, services need to find each other. Eureka acts like a phone book. All services register themselves with Eureka, and when the gateway needs to call the auth service, it asks Eureka for the address.

> This makes our system flexible. We can run multiple copies of a service for load balancing, and Eureka handles it automatically.

### Backend Monolith Contributions

> I also contributed to parts of the **Backend Service**.

> I worked on the FIR assignment logic where new FIRs are automatically assigned to authorities using a round-robin approach. This distributes the workload evenly.

> I also helped with integrating Feign clients for service-to-service communication.

### Frontend Revamp

> Finally, I did a **complete revamp of the frontend**.

> I redesigned the user dashboard, authority dashboard, and admin dashboard using React.

> I made sure the design is modern, clean, and user-friendly. I used proper state management, added loading states, error handling, and made it responsive for different screen sizes.

> I also implemented the login and signup flows with proper token management – storing tokens securely and handling token refresh automatically.

---

## SECTION 3: CHALLENGES FACED (1 minute)

> Now let me share some challenges I faced.

### Challenge 1: CORS Errors

> The biggest challenge was **CORS errors**.

> When the frontend tried to call the API, the browser blocked the request because of cross-origin restrictions.

> The tricky part was that even error responses like 401 or 403 were getting blocked. The browser could not read the error message, so it just showed "Network Error" which was not helpful.

### Challenge 2: JWT Validation at Gateway

> Another challenge was **validating JWT at the gateway level**.

> I had to make sure the gateway correctly parses the token, handles expired tokens, and returns proper error messages in JSON format – not HTML.

> I also had to skip validation for OPTIONS requests. These are preflight requests that browsers send before the actual request, and they don't carry any token.

### Challenge 3: Service Discovery Issues

> I also faced issues with **service discovery**.

> Sometimes the gateway could not find the backend service because it registered with a hostname that wasn't reachable. I had to configure it to use IP addresses instead.

### Challenge 4: Rate Limiting with Redis

> Setting up **rate limiting** was also challenging.

> I had to run Redis, configure the token bucket algorithm, and create a key resolver that limits requests per IP address.

---

## SECTION 4: HOW I OVERCAME THESE CHALLENGES (1 minute)

> Here is how I solved these challenges.

### Solution for CORS

> For CORS, I created a custom **CorsWebFilter** that runs at the highest priority.

> This filter runs before any other filter, including the JWT filter. It handles OPTIONS requests immediately and adds CORS headers to every response – even error responses.

> This fixed the issue where error messages were blocked by the browser.

### Solution for JWT Validation

> For JWT validation, I extended **AbstractGatewayFilterFactory** to create a configurable filter.

> I added proper exception handling for all JWT-related errors – expired tokens, malformed tokens, and invalid tokens. Each error has a unique error code and a clear message.

> I also made sure to skip validation for OPTIONS requests by checking the HTTP method first.

### Solution for Service Discovery

> For service discovery, I configured `prefer-ip-address: true` in the Eureka client settings.

> This made services register with their IP addresses instead of hostnames, which solved the reachability issue.

### Solution for Rate Limiting

> For rate limiting, I used Spring Cloud Gateway's built-in **RequestRateLimiter** with Redis.

> I created a custom KeyResolver bean that extracts the client's IP address. This way, each IP is rate-limited separately.

> I configured different rate limits for different routes – stricter limits for login endpoints to prevent attacks.

---

## SECTION 5: SKILLS DEMONSTRATED (30 seconds)

> Through this project, I demonstrated skills in:

> - **Java and Spring Boot** for backend development
> - **Spring Cloud** for microservices – Gateway, Eureka, and Feign Clients
> - **JWT-based security** for authentication
> - **Redis** for rate limiting
> - **React** for frontend development
> - **Docker** for containerization
> - **Problem-solving** for debugging complex distributed systems

---

## OUTRO (30 seconds)

> To summarize, I built the Auth Service, the complete API Gateway, set up Eureka Server, contributed to the backend, and did a full frontend revamp.

> I faced challenges with CORS, JWT validation, service discovery, and rate limiting – and I solved all of them.

> This project taught me how microservices work together and how to build secure, scalable applications.

> Thank you for watching. If you have any questions, feel free to ask.

---

## QUICK REFERENCE: Key Technical Terms to Mention

| Term | Simple Explanation |
|------|-------------------|
| JWT | A secure token that proves who the user is |
| API Gateway | The main door that all requests go through |
| Eureka | A phone book that helps services find each other |
| CORS | Rules for allowing cross-domain requests |
| Rate Limiting | Limiting how many requests someone can make |
| Microservices | Breaking a big app into small, independent services |

---

my video script , any objections pls tell