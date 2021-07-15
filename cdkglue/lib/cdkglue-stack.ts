import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import * as glue from  '@aws-cdk/aws-glue';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';

export class CdkglueStack extends cdk.Stack {
    private readonly newProperty = {};

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

  /*  new s3.Bucket(this, 'MyFirstBucket', {
      bucketName: 'test-cdk-s3bucket',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY

    });*/

//create Iam role & policy---------------------
    const role = new iam.Role(this, 'my-glue-job-role-cdk1', {
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
    });

    const gluePolicy = iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSGlueServiceRole");
    role.addManagedPolicy(gluePolicy);

//S3 bucket & add policies, role---------
    const myBucket = new s3.Bucket(this, 'testcdktestglues3bucketstest1', {
      versioned: true,
      bucketName: 'testcdktestglues3buckettest1',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
      });
      const bucketPolicy = new s3.BucketPolicy(this, 'bucket-policy-id-2', {
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
   
//Glue database & Crawler-----------------------
   
    const gluedatabase= new glue.CfnDatabase(this, 'my-glue-database',{
       catalogId: '366101389009',
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
     
//Glue job---------------------------

    const gluejob= new glue.CfnJob(this, 'my-glue-job', {
    role: role.roleArn,
    command: {
        name: 'pythonshell',
        pythonVersion: '3',
        scriptLocation: 's3://testcdktestglues3bucket/glue-python-scripts/hi.py'
        }
    });
    
    new s3deploy.BucketDeployment(this, 'DeployGlueJobFiles', {
      sources: [s3deploy.Source.asset('./resources/glue-scripts')],
      destinationBucket: myBucket,
      destinationKeyPrefix: 'glue-python-scripts'
    });
 }
}
