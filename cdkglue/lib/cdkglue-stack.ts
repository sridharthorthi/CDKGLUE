import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import * as glue from  '@aws-cdk/aws-glue';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';

export class CdkStack extends cdk.Stack {
    private readonly newProperty = {};

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //The code that defines your stack goes here//
  /* new s3.Bucket(this, 'MyFirstBucket', {
      bucketName: 'test-cdk-s3bucket',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY

    });*/
    //create Iam role & policy
    const role = new iam.Role(this, 'my-glue-job-role-cdk221', {
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
    });

    const gluePolicy = iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSGlueServiceRole");
    role.addManagedPolicy(gluePolicy); 

//S3 bucket, policy---------
    const myBucket = new s3.Bucket(this, 'testcdktestglues3bucketstest321', {
      versioned: true,
      bucketName: 'testcdktestglues3buckettest31',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
      });
      const bucketPolicy = new s3.BucketPolicy(this, 'bucket-policy-id-4', {
      bucket: myBucket,
    });
    const s3princpal=  bucketPolicy.document.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
       // principals: [new iam.AccountPrincipal('187419755406/')],
        principals: [new iam.ArnPrincipal('arn:aws:iam::187419755406:role/S3copyunloadrole')],
        actions: ['*'],
        resources: [`${myBucket.bucketArn}/*`],
      }),
      );
    
    myBucket.grantRead(role);
   
   //Glue database & Crawler
   
    const gluedatabase= new glue.CfnDatabase(this, 'my-glue-database',{
       catalogId: '673189904723',
       databaseInput: {name: 'testcdkdatabase'}
     });
     
     const gluecrawler = new glue.CfnCrawler(this, 'glue_crawler', {
          databaseName: 'testcdkdatabase',
          role: role.roleArn,
          schedule:{'scheduleExpression':'cron(15 12 * * ? *)'},
          //recrawlpolicy: {},
          targets: {
            s3Targets: [{ path: "s3://testcdktestglues3bucket/" }]
          }
     });
     
  
  //Glue job----------------- 
  const gluejob= new glue.CfnJob(this, 'my-glue-job1', {
    role: role.roleArn,
    command: {
        name: 'pythonshell',
        pythonVersion: '3',
        scriptLocation: 's3://testcdktestglues3bucket/glue-python-scripts/job1.py'
        },
      maxRetries: 0
    });
    
    new s3deploy.BucketDeployment(this, 'DeployGlueJobFiles', {
      sources: [s3deploy.Source.asset('./resources/glue-scripts')],
      destinationBucket: myBucket,
      destinationKeyPrefix: 'glue-python-scripts'
    });
    
    const gluejob1= new glue.CfnJob(this, 'my-glue-job2', {
    role: role.roleArn,
    command: {
        name: 'pythonshell',
        pythonVersion: '3',
        scriptLocation: 's3://testcdktestglues3bucket/glue-python-scripts/job2.py'
        },
    maxRetries: 0
    });
    
    new s3deploy.BucketDeployment(this, 'DeployGlueJobFiles1', {
      sources: [s3deploy.Source.asset('./resources/glue-scripts')],
      destinationBucket: myBucket,
      destinationKeyPrefix: 'glue-python-scripts1'
    });
    
   const gluejob2 = new glue.CfnJob(this, 'my-glue-job3', {
      role: role.roleArn,
      command: {
          name: 'pythonshell',
          pythonVersion: '3',
          scriptLocation: 's3://testcdktestglues3bucket/glue-python-scripts/job3.py'
          },
       maxRetries: 0
    });
    
    new s3deploy.BucketDeployment(this, 'DeployGlueJobFiles2', {
      sources: [s3deploy.Source.asset('./resources/glue-scripts')],
      destinationBucket: myBucket,
      destinationKeyPrefix: 'glue-python-scripts2'
    });
    
    const trigger1 = new glue.CfnTrigger(this, 'trigger1', {
      actions:[{jobName:gluejob2.name}],
      name : "trigger1",
      type: "SCHEDULED",
      schedule: 'cron(15 12 * * ? *)',
      startOnCreation: true,
    });
//end 
 }
}
