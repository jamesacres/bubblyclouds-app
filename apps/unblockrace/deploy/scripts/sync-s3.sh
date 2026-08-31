#!/bin/sh
aws s3 sync ../out/ s3://$BUCKET_NAME/
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths '/*'
