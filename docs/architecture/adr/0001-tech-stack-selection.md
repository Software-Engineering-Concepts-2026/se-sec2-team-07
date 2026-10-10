# ADR 0001: Original Next.js and Firebase technology proposal

**Status:** Superseded for the active application by [ADR 0002](0002-implement-selected-tech-stack.md), following the user's explicit selection of `tech_stack.md` on 2026-09-11.

## Context

Our project, Focus Flashcards, is an AI-powered web application designed to help university students and lifelong learners transform study materials into digital flashcards for efficient learning and exam preparation.

The project is developed by Group 07 as part of a one-semester software engineering course. Our primary constraints include a limited development timeline, rapid prototyping, and ease of deployment. Our team has experience with HTML, CSS, JavaScript, React, Next.js, TypeScript, SQL, and Git/GitHub, making modern web technologies the most suitable choice for this project.

## Decision

We will use Next.js with React and TypeScript to build the web application, including both the frontend and backend through Next.js API Routes. Supabase (PostgreSQL) will be used as the primary relational database, while Firebase Authentication and Firebase Storage will handle user authentication and file storage. OpenAI API will provide AI-powered flashcard generation, and the application will be deployed on Vercel.

## Consequences

- **Positive:**

* The selected technology stack aligns well with the team's existing skills, reducing the learning curve and accelerating development.
* Next.js enables component-based development, improving code reusability and maintainability.
* Using a single framework for both frontend and backend simplifies project architecture and deployment.
* Supabase provides a robust PostgreSQL database with built-in APIs, making data management more efficient.
* Firebase Authentication offers secure user authentication without implementing complex security mechanisms.
* Firebase Storage efficiently manages uploaded study materials and integrates well with Firebase Authentication.
* OpenAI API significantly reduces the time required to create high-quality flashcards from study materials.
* Vercel provides fast, automated deployment directly from GitHub, supporting rapid iteration throughout the semester.

- **Negative:**

* Relying on OpenAI API introduces additional operational costs and requires a stable internet connection.

* The free tiers of Firebase, Supabase, and Vercel include usage limits that may affect scalability during heavy usage.
* Next.js API Routes are suitable for medium-sized applications but may become difficult to maintain if the backend grows significantly.
* The system depends on several third-party cloud services, meaning outages or API changes may temporarily affect system functionality.
* AI-generated flashcards may occasionally contain inaccurate or incomplete information, requiring users to review and edit the generated content.
* Integrating multiple cloud services increases configuration complexity and requires careful management of environment variables and API keys.

This record preserves the original proposal. Next.js, Firebase Authentication and Firebase Storage are not used by the current application. See [the architecture index](../README.md) for current decisions.

## Alternatives considered

The original record did not document a comparative assessment of alternatives. The later implemented React/Vite and Express selection is recorded in [ADR 0002](0002-implement-selected-tech-stack.md); it supersedes this proposal rather than extending its Next.js/Firebase runtime.
