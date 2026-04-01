# AWS Dynamic DNS (No-IP) Service
Deploy this project to your AWS account to get a **free** Dynamic DNS (No-IP like) service using Route 53, API Gateway, and Lambda. The project uses :zap:[AWS SAM (Serverless Application Model)](https://aws.amazon.com/serverless/sam/) to simplify development and continuous deployment, so adding and removing this service from your AWS account is as simple as running one single command.

To update your dynamic IP address in a Route 53 record, a simple HTTP call is needed to execute the following process:

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/53be45a6-bd7b-4e88-a9fa-30aa54360e55">
  <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/2ce98cf2-21e0-49a3-946a-867abc1a68d4">
  <img alt="Shows an illustrated sun in light mode and a moon with stars in dark mode." src="https://github.com/user-attachments/assets/2ce98cf2-21e0-49a3-946a-867abc1a68d4">
</picture>

## Requirements
+ AWS account with a configured domain and hosted zone in AWS Route 53
+ AWS CLI configured with credentials ([https://aws.amazon.com/cli](https://aws.amazon.com/cli))
+ AWS SAM CLI ([https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html))
+ Git ([https://git-scm.com/downloads](https://git-scm.com/downloads))
+ Node.js and npm ([https://www.npmjs.com/get-npm](https://www.npmjs.com/get-npm))

## Installation
Using a terminal, move to a new directory and clone this Git project:
```bash
git clone https://github.com/panchosoft/AWS-DDNS.git
cd AWS-DDNS
```
Install the dependencies:

```bash
npm install
```

## Usage
### 1) Deploy service to AWS
Run the following command in a terminal to deploy the service to your AWS account:
```bash
# First time deployment (interactive setup)
sam deploy --guided
```
Follow the prompts:
- **Stack Name**: `aws-ddns` (or your preferred name)
- **AWS Region**: `us-east-2` (or your preferred region)
- **Confirm changes before deploy**: Y
- **Allow SAM CLI IAM role creation**: Y
- **Save arguments to samconfig.toml**: Y

After the first deployment, you can simply run:
```bash
sam deploy
```

The output will show the API Gateway endpoint URL that allows updating the DNS record value.
### 2) Create/Update hosted zone record
Use a web browser or cURL to call the endpoint URL and include the following two URL parameters:

+ hosted_zone_id = XXXXXXXXXXXX (Get your Hosted Zone ID here: https://console.aws.amazon.com/route53/v2/hostedzones)
+ record_name = mydns.mydomain.com

**Command Example**
```bash
# Call the endpoint URL (replace with your actual endpoint from sam deploy output)
curl "https://xxxxxxxxxx.execute-api.us-east-2.amazonaws.com/Prod/ddns?hosted_zone_id=XXXXXXXXXXXX&record_name=mydns.mydomain.com"
```
A new record entry will be created in Route 53 including the specified record name and the IP address of the device that sent the request. If the record name already exists, only its value will be updated.

![AWS Route 53 record name](https://labs.panchosoft.com/aws-ddns/aws-ddns-updated-dns-record.png)
### 3) Schedule an automated job/task
The endpoint URL can be called everytime you need to update your public IP address in the hosted zone record. However, you might want to automate this task on your personal computer or using an always-on device like a Rasperry PI in your home network.

Here's an example of a crontab entry to schedule a call to the endpoint in a Linux-based system:

```bash
# Execute the curl command every 12 hours (crontab entry)
0 */12 * * * /usr/bin/curl -q "https://xxxxxxxxxx.execute-api.us-east-2.amazonaws.com/Prod/ddns?hosted_zone_id=XXXXXXXXXXXX&record_name=mydns.mydomain.com" 2>&1 > /dev/null
