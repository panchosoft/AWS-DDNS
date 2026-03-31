# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AWS-DDNS is a serverless Dynamic DNS service that provides No-IP-like functionality using AWS Route 53, API Gateway, and Lambda. An HTTP GET request to the API endpoint automatically updates a Route 53 A record with the requester's public IP address.

## Architecture

The application has a simple serverless flow:
- **API Gateway** exposes a single HTTP GET endpoint at `/ddns`
- **Lambda function** (`app.update` in `app.js`) extracts the caller's IP from `event.requestContext.identity.sourceIp` and performs an UPSERT operation on Route 53
- **Route 53** stores the DNS A record with the IP address

The Lambda handler requires two query parameters: `hosted_zone_id` and `record_name`. It uses AWS SDK v3 (`@aws-sdk/client-route-53`) with `route53:ChangeResourceRecordSets` IAM permission (configured in `serverless.yml`). Records are created with TTL of 300 seconds.

## Commands

```bash
# Deploy to AWS (defaults: prod stage, us-east-2 region)
serverless deploy

# Deploy to specific stage/region
serverless deploy --stage dev --region us-west-2

# Remove service from AWS
serverless remove

# View logs in real-time
serverless logs -f updateDNS --tail

# Install dependencies
npm install
```

## Development Setup

Requires Serverless Framework installed globally: `npm install -g serverless`

The entire application logic is in `app.js` (single Lambda handler). Runtime is Node.js 20.x as configured in `serverless.yml`.
