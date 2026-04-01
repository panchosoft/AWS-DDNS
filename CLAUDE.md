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
# First-time deployment (interactive setup)
sam deploy --guided

# Subsequent deployments
sam deploy

# Deploy to specific region/stack name
sam deploy --region us-west-2 --stack-name aws-ddns-dev

# View logs in real-time
sam logs -n UpdateDNSFunction --tail

# Remove service from AWS
sam delete

# Install dependencies
npm install
```

## Development Setup

Requires AWS SAM CLI installed: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

The entire application logic is in `app.js` (single Lambda handler). Infrastructure is defined in `template.yaml`. Runtime is Node.js 24.x.
