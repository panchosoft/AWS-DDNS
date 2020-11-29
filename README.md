# AWS Dynamic DNS (No-IP) Service 
Deploy this project to your AWS account to get a **free** Dynamic DNS (No-IP like) service using Route 53, API Gateway, and Lambda. The project uses the :zap:[Serverless Framework](https://www.serverless.com/) to simplify development and continous deployment, so adding and removing this service from your AWS account is as simple as running one single command.

To update your dynamic IP address in a Route 53 record, a simple HTTP call is needed to execute the following process:
![AWS DDNS Architecture Diagram](https://labs.panchosoft.com/aws-ddns/aws-ddns-architecture.svg)

## Requirements
+ AWS account with a configured domain and hosted zone in AWS Route 53. 
+ AWS CLI ([https://aws.amazon.com/cli](https://aws.amazon.com/cli))
+ Git ([https://git-scm.com/downloads](https://git-scm.com/downloads))
+ Npm Package Manager ([https://www.npmjs.com/get-npm](https://www.npmjs.com/get-npm))

## Installation
Using a terminal, move to a new directory and clone this Git project:
```bash
git clone https://github.com/panchosoft/AWS-DDNS.git
```
Use [npm](https://www.npmjs.com/get-npm) to install the application.

```bash
# Install Serverless Framework
npm install -g serverless
# Install package dependencies
npm install
```

## Usage
### 1) Deploy service to AWS
Run the following command in a terminal to deploy the service to your AWS account:
```bash
serverless deploy
```
You should receive a similar output as the one displayed in the image below. The green mark indicates the endpoint URL that allows updating the DNS record value.
![Serverless deploy command output](https://labs.panchosoft.com/aws-ddns/aws-ddns-deploy.png)
### 2) Create/Update hosted zone record
Use a web browser or cURL to call the endpoint URL and include the following two URL parameters:
###
+ hosted_zone_id = XXXXXXXXXXXX (Get your Hosted Zone ID here: https://console.aws.amazon.com/route53/v2/hostedzones)
+ record_name = mydns.mydomain.com

**Command Example**
```bash
# Call the endpoint URL
curl "https://1cjix7wahb.execute-api.us-east-2.amazonaws.com/prod/ddns?hosted_zone_id=XXXXXXXXXXXX&record_name=mydns.mydomain.com"
```
A new record entry will be created in Route 53 including the specified record name and the IP address of the device that sent the request. If the record name already exists, only its value will be updated.

![AWS Route 53 record name](https://labs.panchosoft.com/aws-ddns/aws-ddns-updated-dns-record.png)
### 3) Schedule an automated job/task
The endpoint URL can be called everytime you need to update your public IP address in the hosted zone record. However, you might want to automate this task on your personal computer or using an always-on device like a Rasperry PI in your home network.

Here's an example of a crontab entry to schedule a call to the endpoint in a Linux-based system:

```bash
# Execute the curl command every 12 hours (crontab entry)
0 */12 * * * /usr/bin/curl -q "https://1cjix7wahb.execute-api.us-east-2.amazonaws.com/prod/ddns?hosted_zone_id=XXXXXXXXXXXX&record_name=mydns.mydomain.com" 2>&1 > /dev/null