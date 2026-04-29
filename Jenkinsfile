pipeline {
    agent { node { label 'roboshop' } }


        
    stages {
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Dependabot Security Check') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'github-token', variable: 'GITHUB_TOKEN')]) {
                        def repoUrl = sh(script: 'git remote get-url origin', returnStdout: true).trim()
                        def repoPath = repoUrl.replaceAll(/.*github\.com[\/:]/, '').replaceAll(/\.git$/, '')

                        def alertCount = sh(
                            script: """
                                curl -sf \
                                     -H "Authorization: Bearer \$GITHUB_TOKEN" \
                                     -H "Accept: application/vnd.github+json" \
                                     -H "X-GitHub-Api-Version: 2022-11-28" \
                                     "https://api.github.com/repos/${repoPath}/dependabot/alerts?state=open&per_page=100" \
                                | jq '[.[] | select(.security_vulnerability.severity == "high" or .security_vulnerability.severity == "critical")] | length'
                            """,
                            returnStdout: true
                        ).trim()

                        if (alertCount.toInteger() > 0) {
                            error("Build aborted: ${alertCount} HIGH/CRITICAL Dependabot alert(s) detected. Resolve them before proceeding.")
                        }
                        echo "Dependabot check passed — no HIGH or CRITICAL vulnerabilities found."
                    }
                }
            }
        }

        stage('Unit Tests') {
            steps {
                sh 'npm test'
            }
        }

        stage('SonarQube Analysis') {
            environment {
                def scannerHome = tool 'sonar-8'
            }
            steps {
                script{
                    withSonarQubeEnv('sonar-server') {
                        sh  "${scannerHome}/bin/sonar-scanner"
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh """
                    docker build \
                        -t catalogue:${env.BRANCH_NAME}-${env.BUILD_NUMBER} \
                        .
                """
            }
        }
    }
 


    post {
        success {
            echo "Pipeline succeeded on branch: ${env.BRANCH_NAME}"
        }
        failure {
            echo "Pipeline failed on branch: ${env.BRANCH_NAME}"
        }
    }
}
