using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.AI;

public class Boss : MonoBehaviour
{

    public GameObject boxTP;
	public int speed;
	public float FireRate;
	public Rigidbody2D projectile;
	public Transform[] points;
	public Rigidbody2D Minion;
	private Vector3 velocity = Vector3.zero;

	bool started = false;
	bool pos1 = false;
	bool pos2 = false;
	bool pos3 = false;



	// Use this for initialization
	void Start () {
        boxTP = GameObject.FindWithTag("BoxTp");
        boxTP.SetActive(false);
		InvokeRepeating("throwProjectile", 0, FireRate);
	}

	private void FixedUpdate()
	{
//        Debug.Log("pos1" + pos1);
//        Debug.Log("pos2" + pos2);

		
	}

	public void death()
	{
		GameObject.FindWithTag("Player").GetComponent<PlayerController>().defeatBoss(gameObject.name);
        GameObject.FindWithTag("Player").GetComponent<PlayerHealth>().numOfHeart += 1;
        GameObject.FindWithTag("Player").GetComponent<PlayerHealth>().LifePoints += 10;
        boxTP.SetActive(true);
		Destroy(gameObject);
	}

	public void InvokeMinion()
	{

		var minion2Pos = transform.position;

		minion2Pos.y -= 3;

		// print("Minion Spawn");
		Instantiate(Minion, minion2Pos, Quaternion.identity);
	}

	void throwProjectile()
	{
		Instantiate(projectile, transform.position, transform.rotation);
	}

}
