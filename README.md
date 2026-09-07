# 📝 Inkspace

A scalable, full-stack blogging platform built using a **Microservices Architecture**. The application is containerized with **Docker**, orchestrated with **Kubernetes**, and uses **NGINX Ingress** for routing.

![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=for-the-badge&logo=kubernetes&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)

## 🚀 Live Demo

**[inkspace-frontend.onrender.com](https://inkspace-frontend.onrender.com)**

Deployed free on Render (4 backend microservices + static frontend) with MongoDB
Atlas — one database per service, per the architecture below. See
[DEPLOY.md](./DEPLOY.md) for the full deployment guide.

> Free-tier services spin down after ~15 min idle; a keep-alive workflow
> ([`.github/workflows/keep-alive.yml`](./.github/workflows/keep-alive.yml))
> pings all 5 services every 10 minutes so cold starts shouldn't come up in
> normal use.

## 🏗 Architecture

The application is decomposed into independent services, each with its own database to ensure loose coupling and independent scalability.

* **Frontend Service:** React (Vite + TypeScript)
* **Auth Service:** Handles User Registration, Login, and JWT generation.
* **Post Service:** Handles CRUD operations for Blog Posts.
* **Comment Service:** Manages comments on posts.
* **Like Service:** Manages likes on posts.
* **Ingress Controller:** NGINX handles routing between the frontend and backend services.

## 🛠 Tech Stack

* **Frontend:** React, TypeScript, TailwindCSS, Vite
* **Backend:** Node.js, Express, TypeScript
* **Database:** MongoDB (Per-service database pattern)
* **DevOps:** Docker, Kubernetes (Minikube/Docker Desktop), NGINX Ingress
* **Authentication:** JWT (JSON Web Tokens)

## 🚀 Prerequisites

Before you begin, ensure you have the following installed:
* [Docker Desktop](https://www.docker.com/products/docker-desktop/)
* [Kubernetes CLI (kubectl)](https://kubernetes.io/docs/tasks/tools/)
* [Minikube](https://minikube.sigs.k8s.io/docs/start/) (Optional, if not using Docker Desktop's K8s)


```mermaid
graph TD
    %% -- HIGH CONTRAST DARK MODE THEME --
    
    %% Styling Definitions
    %% Stroke is set to white (#fff) to pop against black background
    %% Fills are bright neons to ensure black text is readable
    classDef user fill:#ff79c6,stroke:#fff,stroke-width:2px,color:black;
    classDef ingress fill:#f1fa8c,stroke:#fff,stroke-width:2px,color:black;
    classDef frontend fill:#8be9fd,stroke:#fff,stroke-width:2px,color:black;
    classDef backend fill:#50fa7b,stroke:#fff,stroke-width:2px,color:black;
    classDef db fill:#bd93f9,stroke:#fff,stroke-width:2px,shape:cylinder,color:black;

    %% Nodes
    User((User / Browser)):::user
    
    subgraph Kubernetes_Cluster [Kubernetes Cluster]
        direction TB
        %% White border for the subgraph
        style Kubernetes_Cluster fill:none,stroke:#fff,stroke-width:2px,color:#fff
        
        Ingress{<b>NGINX Ingress</b><br>Host: inkspace.local}:::ingress

        subgraph Frontend_Layer
            style Frontend_Layer fill:none,stroke:#8be9fd,stroke-width:1px,stroke-dasharray: 5 5,color:#fff
            Front[<b>Frontend Service</b><br>React + Vite]:::frontend
        end

        subgraph Backend_Layer [Microservices]
            style Backend_Layer fill:none,stroke:#50fa7b,stroke-width:1px,stroke-dasharray: 5 5,color:#fff
            Auth[<b>Auth Service</b><br>Port: 5000]:::backend
            Post[<b>Post Service</b><br>Port: 5001]:::backend
            Comm[<b>Comment Service</b><br>Port: 5002]:::backend
            Like[<b>Like Service</b><br>Port: 5003]:::backend
        end

        subgraph Database_Layer [Persistent Storage]
            style Database_Layer fill:none,stroke:#bd93f9,stroke-width:1px,stroke-dasharray: 5 5,color:#fff
            AuthDB[(Auth Mongo)]:::db
            PostDB[(Post Mongo)]:::db
            CommDB[(Comment Mongo)]:::db
            LikeDB[(Like Mongo)]:::db
        end
    end

    %% Routing Flow - Thick arrows for visibility
    User ==>|1. Request http://inkspace.local| Ingress

    %% Ingress Rules
    Ingress -->|2. Path: /| Front
    Ingress -->|2. Path: /api/auth/*| Auth
    Ingress -->|2. Path: /api/posts/*| Post
    Ingress -->|2. Path: /api/comments/*| Comm
    Ingress -->|2. Path: /api/likes/*| Like

    %% Database Connections - Dotted white lines
    Auth -.->|3. Connect| AuthDB
    Post -.->|3. Connect| PostDB
    Comm -.->|3. Connect| CommDB
    Like -.->|3. Connect| LikeDB
    
    %% Force Link Colors to White (Note: varying support in some viewers)
    linkStyle default stroke:#fff,stroke-width:2px;
```


## 📦 Installation & Deployment

### 1. Clone the Repository
```bash
git clone https://github.com/elus444/Inkspace.git
cd inkspace

```


---

### 2. Configure Hosts File

The Ingress is configured for the host **`inkspace.local`**, so you must map it to your local machine.

**Windows:**

1. Open Notepad as Administrator
2. Edit: `C:\Windows\System32\drivers\etc\hosts`

**Mac/Linux:**

```bash
sudo nano /etc/hosts
```

Add this line:

```
127.0.0.1   inkspace.local
```

---

### 3. Deploy to Kubernetes

Apply manifests **in order** so databases, secrets, and services initialize correctly.

```bash
# 1. Apply Secrets and ConfigMaps
kubectl apply -f k8s/secrets.yml
kubectl apply -f k8s/configMap.yml

# 2. Create Persistent Volume Claims (Storage)
kubectl apply -f k8s/mongo-pvc.yml

# 3. Deploy MongoDB Databases
kubectl apply -f k8s/mongo-deployments.yml

# 4. Deploy Backend Microservices
kubectl apply -f k8s/backend-auth.yml
kubectl apply -f k8s/backend-post.yml
kubectl apply -f k8s/backend-comment.yml
kubectl apply -f k8s/backend-like.yml

# 5. Deploy Frontend
kubectl apply -f k8s/frontend.yml

# 6. Apply Ingress Routes
kubectl apply -f k8s/ingress-backend.yml
kubectl apply -f k8s/ingress-frontend.yml

# 7. Apply Horizontal Pod Autoscaler
kubectl apply -f k8s/hpa.yml
```

---

### 4. Access the Application

Open:

👉 **[http://inkspace.local](http://inkspace.local)**

---

## 🔧 Environment Variables

### Kubernetes Secrets (`secrets.yml`)

All values must be **Base64 encoded**.

```
MONGO_ROOT_USERNAME
MONGO_ROOT_PASSWORD
JWT_SECRET
```

### ConfigMap (`configMap.yml`)

Contains:

* `AUTH_MONGO_URI`
* `POST_MONGO_URI`
* `COMMENT_MONGO_URI`
* `LIKE_MONGO_URI`
* Service URLs for internal cluster communication

Example:

```
AUTH_MONGO_URI=mongodb://auth-mongo:27017/authService
POST_MONGO_URI=mongodb://post-mongo:27017/postService
```

---

## 🔌 API Endpoints

### Ingress Routing Overview

| Service         | Path Prefix     | Description         |
| --------------- | --------------- | ------------------- |
| Frontend        | `/`             | React application   |
| Auth Service    | `/api/auth`     | Register/Login/JWT  |
| Post Service    | `/api/posts`    | CRUD on posts       |
| Comment Service | `/api/comments` | Manage comments     |
| Like Service    | `/api/likes`    | Like / Unlike posts |

## Horizontal Pod Autoscaler (HPA) – Auto-scaling in action

All backend microservices and the frontend are configured with **Horizontal Pod Autoscaling** based on CPU utilization.  
When traffic spikes, Kubernetes automatically scales the number of pods to maintain performance.

| Service            | Target CPU | Min Pods | Max Pods | Current Behavior (tested)                     |
|---------------------|------------|----------|----------|-----------------------------------------------|
| Auth Service        | 60%        | 1        | 10       | Scales instantly under registration storms   |
| Post Service        | 60%        | 1        | 10       | Went from 1 → 10 pods                         |
| Comment Service     | 60%        | 1        | 10       | Scales during comment floods                  |
| Like Service        | 60%        | 1        | 10       | Scales on viral posts                         |
| Frontend (React)    | 50%        | 2        | 15       | Keeps UI responsive under heavy traffic       |

### How to see it live (30-second demo)

```bash
# 1. Hammer the Post service
kubectl run load-generator --rm -i --tty --image=busybox -n inkspace -- /bin/sh -c \
  "while true; do wget -q -O- http://post-service:5001/api/posts; done"

# 2. In another terminal, watch the magic
kubectl get hpa post-service-hpa -n inkspace -w
kubectl get pods -n inkspace -l app=post-service -w

```
