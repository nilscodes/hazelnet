import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
	id("org.springframework.boot") version "2.6.0"
	id("io.spring.dependency-management") version "1.0.11.RELEASE"
	kotlin("jvm")
	kotlin("plugin.spring")
}

group = "io.hazelnet.cardano"
version = "0.0.1-SNAPSHOT"
java.sourceCompatibility = JavaVersion.VERSION_11

repositories {
	mavenCentral()
	maven {
		setUrl("https://jitpack.io")
	}
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter-jdbc")
	implementation("org.springframework.boot:spring-boot-starter-web")
	implementation("org.springframework.boot:spring-boot-starter-actuator")
	implementation("io.micrometer:micrometer-registry-prometheus")
	implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
	implementation("org.jetbrains.kotlin:kotlin-reflect")
	implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8")
	implementation("org.jetbrains.kotlinx:kotlinx-coroutines-jdk8")
	implementation("com.jayway.jsonpath:json-path:2.7.0")
	implementation("com.bloxbean.cardano:cardano-client-lib:0.4.3")
	runtimeOnly("org.postgresql:postgresql")
	testImplementation("org.springframework.boot:spring-boot-starter-test")

	implementation(project(":hazelnet-cardano-shared"))
	implementation("com.github.blockfrost:blockfrost-kotlin:0.0.3")
	// The following are explicit because the blockfrost library does not get the correct okhttp version
	implementation("com.squareup.okhttp3:okhttp:4.9.2")
	implementation("com.squareup.okhttp3:logging-interceptor:4.9.2")
}

tasks.withType<KotlinCompile> {
	kotlinOptions {
		freeCompilerArgs = listOf("-Xjsr305=strict")
		jvmTarget = "11"
	}
}

tasks.withType<Test> {
	useJUnitPlatform()
}
