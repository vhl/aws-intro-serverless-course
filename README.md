# AWS Training: Build a serverless application

## Goal

Build a simple serverless web application that gives participants
hands-on experience with a number of essentials AWS services.

## Prompt

You've been hired by a startup to build a revolutionary new web
application the likes of which the world has never seen.  Using this
application, anyone can easily share their photos with the world and
receive comments and "likes" from other users.  The marketing experts
at the company have branded this application as the "Innovative Image
Sharer."  Unfortunately, this company has very bad management and
you've been given just *one day* to create the "minimum viable
product" using AWS.  But there's good news!  They hired another
developer to write a state-of-the-art web frontend and they're already
done.  Quickly build the application backend so you can get paid
before the VC money dries up!

## Services you will learn about

* API Gateway
* DynamoDB
* IAM
* Lambda
* S3

## Helpful links

* [AWS JavaScript SDK documentation](https://aws.amazon.com/sdk-for-node-js/)
* [DynamoDB documentation](https://docs.aws.amazon.com/dynamodb/index.html)
* [DynamoDB IAM actions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/api-permissions-reference.html)
* [S3 IAM actions](https://docs.aws.amazon.com/IAM/latest/UserGuide/list_amazons3.html)

## Steps

**BEFORE YOU BEGIN**: Make sure you are in the us-east-1 (N. Virginia)
AWS region for all steps!

### Create image store

We will need another S3 bucket for storing user uploaded images.

* Go to the S3 console
* Click "Create Bucket"
* Enter a *globally* unique name for the bucket like
  "alice-images.dev.vhlcentral.com"
* Click "Next"
* Click "Next"
* Uncheck "Block all public access"
* Click "Next"
* Click "Create Bucket"

### Create data store

Users upload images with a caption in this app.  To store this data,
we will use DynamoDB tables.  We will use two tables: One to store
references to uploaded images and another to store user reactions.

Create the `images` table:

* Go to the DynamoDB console
* In the left-hand side menu (you may need to click an arrow to expand
  it), click "Tables"
* Click "Create table"
* Enter "images" in the "Table Name" field
* Enter "s3Object" in the "Primary key" field
* Click "Create"

Create the `reactions` table:

* Click "Create table"
* Enter "reactions" in the "Table Name" field
* Enter "s3Object" in the "Primary key" field
* Click "Create"
* Click "Create table"
* Enter "reactions" in the "Table Name" field
* Enter "uuid" in the "Primary key" field
* Click "Create"
* Click "reactions"
* Click on the "Indexes" tab
* Click "Create index"
* Enter "s3Object" in the "Primary key" field
* Select the "Add sort key" checkbox
* Enter "timestamp" into the new text field
* Select "Number" from the dropdown to the right of the text field
* Click "Create index"

### Create first backend API function

Our image sharing service needs a small API that supports the
following actions:
* Load feed of most recently uploaded images and associated reactions
* Upload new image with caption
* Add reaction to image

To implement these actions, we'll create 3 Lambda functions, one per
action, but let's start small.  For now, we'll just create a single
function that returns uploaded image data.  This data won't even be
the real deal yet.  We'll just hardcode something.

* Go to the Lambda console
* Click "Create function"
* Ensure the "Author from scratch" radio button is selected
* Enter "fetchRecentImages" in the "Function name" field
* Ensure "Node.js 10.x" is the selected runtime
* Click "Create function"
* Copy/paste the following code into the "Function code" editor area,
  replacing what was there by default:
```javascript
exports.handler = async (event) => {
  return [
    {
      s3Object: "foo.jpg",
      caption: "Hello, world!",
      likes: 99,
      comments: [
        {
          name: "alice",
          comment: "hi!"
        }
      ]
    }
  ];
};
```
* Click "Save"

### Create API gateway

So, we have an `index.html` web page that is capable of running some
JavaScript that can request user uploaded images, and we have a Lambda
function that can provide the data, but something is missing.  Lambda
functions aren't publicly accessible.  We need a way for our page to
talk to our `fetchRecentImages` function over the Internet.  This is
what the API Gateway service was created to facilitate.

* Go to the API Gateway console
* Click "Create API"
* Ensure that "REST" is selected as the protocol
* Enter "ImageService" in the "API name" field
* Enter a description if you'd like
* Ensure "Regional" is selected in the "Endpoint Type" dropdown
* Click "Create API"
* Open the "Actions" dropdown and select "Create Resource"
* Enter "Image" in the "Resource Name" field
* Enter "image" in the "Resource Path" field
* Select the "Enable API Gateway CORS" checkbox
* Click "Create Resource"
* With the `/image` resource selected, open the "Actions" dropdown
  and select "Create Method"
* Select "GET" from the new empty dropdown that appears
* Click the check mark icon next to the dropdown
* Ensure "Lambda function" is selected as the "Integration type"
* Enter "fetchRecentImages" in the "Lambda Function" field
* Click "Save"
* Click "OK" on the modal that appears
* Click "Test" (look for a lightning bolt icon)
* Click "Test" on the new screen that appears
* Verify you see the JSON representation of the hardcoded JS data in
  the Lambda function
* Open the "Actions" dropdown and click "Deploy API"
* Select "New Stage" from the "Deployment stage" dropdown
* Enter "test" in the "Stage name" field
* Click "Deploy"
* Copy the "Invoke URL"
* Edit your local copy of the `index.html` file from the course
  repository
* Change the value of the `BASE_API_URL` variable to the URL you
  copied

### Upload public assets

We will be using an S3 bucket to host static assets: HTML, JavaScript,
and CSS.

* Go to the S3 console
* Click "Create Bucket"
* Enter a *globally* unique name for the bucket like
  "alice-app.dev.vhlcentral.com"
* Click "Next"
* Click "Next"
* Uncheck "Block all public access"
* Click "Next"
* Click "Create Bucket"
* Click on the name of the bucket
* Click "Upload"
* Click "Add files"
* Select `index.html` from the course materials repo
* Click "Next"
* Select "Grant public access to this object(s)" from the "Manage
  public permissions" dropdown menu
* Click "Next"
* Click "Next"
* Click "Upload"
* Go to <http://YOUR_BUCKET_NAME.s3.amazonaws.com/index.html> in your
  web browser to confirm that you can access the file.  You should see
  the single dummy image record we hardcoded into the Lambda function.
  The image will be broken (unless you manually upload a `foo.jpg`
  object to the images bucket) but you should see the caption "Hello,
  world!"

### Fetching records from DynamoDB

Hardcoded response data was just fine to test that the API Gateway was
setup properly, but now we're ready to fetch real records from the
`images` DynamoDB table.  In order to do this, we must first grant the
`fetchRecentImages` Lambda function permission to read from the
`images` table.  Then we can update the function code to query the
table.

* Open the DynamoDB console
* Click "Tables" in the left-hand sidebar
* Click "images"
* Copy the text to the right of "Amazon Resource Name (ARN)" and paste
  it somewhere for later (we will need it shortly)
* Open the IAM console
* Click "Roles" in the left-hand sidebar
* Click on the role with a name like "fetchRecentImages-role-i3r2c5j3"
* Click on the link to the managed policy with a name like
  "AWSLambdaBasicExecutionRole-d9d04b3b-e73e-400e-b418-3fd8a6d5380a"
* Click "Edit Policy"
* Click the "JSON" tab
* Add additional objects to the `Statement` array. You will need to
  replace the text `DDB_IMAGES_ARN` and `DDB_REACTIONS_ARN` in the
  JSON snippet below with the ARN of the `images` table that you
  copied in an earlier step:
```json
{
    "Effect": "Allow",
    "Action": [
        "dynamodb:Scan"
    ],
    "Resource": "DDB_IMAGES_ARN"
},
{
    "Effect": "Allow",
    "Action": [
        "dynamodb:Query"
    ],
    "Resource": "DDB_REACTIONS_ARN/index/s3Object-timestamp-index"
}
```
* Click "Review policy"
* Click "Save changes"
* Open the Lambda console
* Click "fetchRecentImages"
* Replace the function code with the new code below:
```javascript
"use strict";

const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB();

function fetchReactions(s3Object) {
    return dynamodb.query({
        ExpressionAttributeValues: {
            ":s3Object": {
                S: s3Object
            }
        },
        IndexName: "s3Object-timestamp-index",
        KeyConditionExpression: "s3Object = :s3Object",
        Select: "ALL_ATTRIBUTES",
        TableName: "reactions"
    }).promise();
}

exports.handler = async (event, context, callback) => {
    return dynamodb.scan({
        TableName: "images"
    }).promise().then(results => {
        return Promise.all(results.Items.sort((a, b) => {
                return a.timestamp.N < b.timestamp.N;
            }).map(item => {
            return fetchReactions(item.s3Object.S).then(reactions => {
                return {
                    s3Object: item.s3Object.S,
                    caption: item.caption.S,
                    // Count reactions of type "like"
                    likes: reactions.Items.reduce((count, reaction) => {
                        if(reaction.type.S == "like") {
                            return count + 1;
                        }

                        return count;
                    }, 0),
                    // Find all reactions of type "comment" and serialize
                    comments: reactions.Items.filter(reaction => {
                        return reaction.type.S == "comment";
                    }).map(reaction => {
                        return {
                            name: reaction.name.S,
                            text: reaction.text.S
                        };
                    })
                };
            });
        }));
    });
};
```
* Click "Save"
* Go to the S3 console
* Click on the name of your images bucket
* Click "Upload"
* Click "Add files"
* Select an image file from your computer and take note of the file name
* Click "Next"
* Select "Grant public access to this object(s)" from the "Manage
  public permissions" dropdown menu
* Click "Next"
* Click "Next"
* Click "Upload"
* Go to the DynamoDB console
* Click "Tables" in the left-hand sidebar
* Click "images"
* Click "Create item"
* Enter the image file name in the "VALUE" field of `s3Object`
* Enter a UNIX timestamp (eval `Date.now()` in your web browser's
  console to get the current timestamp) in the "VALUE" field of `timestamp`
* Click the `+` icon next to `timestamp`
* Click "Append"
* Click "String"
* Enter "caption" in the "FIELD" field
* Enter any text you'd live in the "VALUE" field of `caption`
* Click "Save"
* Reload the `index.html` page.  You should now see the image +
  caption that you manually created.

## Your turn!

We've walked you through setting up the core infrastructure and built
one working API endpoint, but there are still two endpoints left to
implement:

* `POST /image`: upload an image
* `POST /image/reaction`: post reaction ("like" and "comment" are the
  supported reaction types)

Now it's time to use what you've learned thus far to complete the
backend API.  Take a look at the index.js file in this repository for
more information about how the remaining endpoints are used.

Image and reaction records will a unique id for their primary key
field.  Use the following JavaScript function to generate good enough
values for this exercise:

```javascript
function uuid() {
    var dt = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
}
```

The expected JSON request body for `POST /image` looks like this:

```json
{
    "caption": "sleeping cat",
    "mimeType": "image/jpeg",
    "image": "<base64 encoded blob goes here>"
}
```

The expected JSON request body for `POST /image/reaction` looks like
this:

```json
{
    "type": "comment or like",
    "s3Object": "9d507409-c9b4-41d3-91ef-672310bfe209",
    "name": "alice (only for comments)",
    "text": "neat! (only for comments)"
}
```

Ask for help if you get stuck.  Good luck!

## Common gotchas you may encounter

* Forgetting to deploy API Gateway after making changes
* Missing IAM policy to grant a Lambda function access to the right
  resources

## Going further

Here are some ideas for taking this silly little application to the
next level:

* For time's sake, we've completely ignored the subject of user
  authentication.  Use the Cognito service to add this crucial
  feature.  Modify the DynamoDB tables to track which user uploaded an
  image or added a reaction.
* We don't do any post-processing of uploaded images such as resizing.
  AWS has services for manipulating media that could be used to
  post-process all uploads.
* Wouldn't it be cool to automatically extract any text that appears
  in an uploaded image?  Try using AWS's Textract service to make it
  happen.
* Use the Polly service to convert captions and comments to speech.
* Add support for additional reaction types.  Can you "blorp" posts on
  Instagram?  I don't think so!
